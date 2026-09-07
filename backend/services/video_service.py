from collections.abc import Callable
import math
from pathlib import Path
import random
import shutil
import subprocess
import uuid

import requests

from schemas.video import VideoAspectRatio, VideoScene


BASE_DIR = Path(__file__).resolve().parent.parent
GENERATED_DIR = BASE_DIR / "generated_videos"
TEMP_DIR = BASE_DIR / "temp"
FPS = 30
OUTPUT_SIZES = {"16:9": (1280, 720), "9:16": (1080, 1920)}
MOTION_MODES = ("zoom_in", "zoom_out", "pan_left", "pan_right")
TRANSITION_FRAMES = 15  # Half a second at 30 fps.
ProgressCallback = Callable[[int, str], None]


def run_ffmpeg(command: list[str]) -> None:
    try:
        result = subprocess.run(
            command, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=1800,
        )
    except FileNotFoundError as error:
        raise RuntimeError("FFmpeg was not found. Install it and add it to PATH.") from error
    except subprocess.TimeoutExpired as error:
        raise RuntimeError("Video rendering timed out. Try fewer or shorter scenes.") from error

    if result.returncode != 0:
        print(f"FFmpeg error:\n{result.stderr}")
        raise RuntimeError("FFmpeg could not render the video. See the backend log for details.")


def download_image(image_url: str, image_path: Path) -> None:
    response = requests.get(
        image_url,
        timeout=30,
        headers={"User-Agent": "AI-YouTube-Video-Generator/1.0"},
    )
    response.raise_for_status()
    content_type = response.headers.get("content-type", "")
    if not content_type.startswith("image/"):
        raise ValueError(
            "The URL did not return an image. "
            f"Received content type: {content_type}"
        )
    image_path.write_bytes(response.content)


def scene_frame_count(duration: float) -> int:
    if not math.isfinite(duration) or duration < 0.1 or duration > 120:
        raise ValueError("Scene duration must be between 0.1 and 120 seconds.")
    return max(3, round(duration * FPS))


def choose_motion_modes(scene_count: int) -> list[str]:
    """Shuffle all four effects in batches, without adjacent repeats."""
    motions: list[str] = []
    while len(motions) < scene_count:
        batch = random.sample(MOTION_MODES, len(MOTION_MODES))
        if motions and batch[0] == motions[-1]:
            batch[0], batch[1] = batch[1], batch[0]
        motions.extend(batch)
    return motions[:scene_count]


def create_scene_clip(
    image_path: Path,
    output_path: Path,
    duration: float,
    motion: str = "zoom_in",
    aspect_ratio: VideoAspectRatio = "16:9",
) -> None:
    total_frames = scene_frame_count(duration)
    if motion not in MOTION_MODES:
        raise ValueError(f"Unknown camera motion: {motion}")
    if aspect_ratio not in OUTPUT_SIZES:
        raise ValueError("Aspect ratio must be 16:9 or 9:16.")
    width, height = OUTPUT_SIZES[aspect_ratio]

    # Smoothstep eases the camera at both ends; on is the output frame index.
    progress = f"(on/{total_frames - 1})"
    eased = f"({progress}*{progress}*(3-2*{progress}))"
    zoom = "1.25"
    x = "(iw-iw/zoom)/2"
    y = "(ih-ih/zoom)/2"
    if motion == "zoom_in":
        zoom = f"1+0.25*{eased}"
    elif motion == "zoom_out":
        zoom = f"1.25-0.25*{eased}"
    elif motion == "pan_left":
        x = f"(iw-iw/zoom)*(1-{eased})"
    else:
        x = f"(iw-iw/zoom)*{eased}"

    # Crop before zoompan to preserve proportions. Oversampling reduces jitter.
    canvas_width, canvas_height = width * 2, height * 2
    video_filter = (
        f"scale={canvas_width}:{canvas_height}:"
        "force_original_aspect_ratio=increase:force_divisible_by=2,"
        f"crop={canvas_width}:{canvas_height},setsar=1,"
        f"zoompan=z='{zoom}':x='{x}':y='{y}':"
        f"d={total_frames}:s={width}x{height}:fps={FPS},"
        "setsar=1,format=yuv420p"
    )
    run_ffmpeg([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-filter_threads", "1", "-i", str(image_path),
        "-vf", video_filter, "-frames:v", str(total_frames),
        "-r", str(FPS), "-c:v", "libx264", "-preset", "medium",
        "-crf", "20", "-threads", "2", "-pix_fmt", "yuv420p",
        "-an", str(output_path),
    ])


def concatenate_clips(
    clip_paths: list[Path],
    clip_frames: list[int],
    output_path: Path,
) -> None:
    """Crossfade clips using frame-aligned offsets, then fade the outer edges."""
    if not clip_paths or len(clip_paths) != len(clip_frames):
        raise ValueError("Each clip must have a matching frame count.")

    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    for clip_path in clip_paths:
        command.extend(["-i", str(clip_path)])

    filters = [
        f"[{index}:v]fps={FPS},settb=1/{FPS},setpts=PTS-STARTPTS,"
        f"setsar=1,format=yuv420p[v{index}]"
        for index in range(len(clip_paths))
    ]
    current = "v0"
    total_frames = clip_frames[0]
    for index in range(1, len(clip_paths)):
        overlap = min(
            TRANSITION_FRAMES,
            clip_frames[index - 1] // 2,
            clip_frames[index] // 2,
        )
        offset = (total_frames - overlap) / FPS
        next_label = f"mix{index}"
        filters.append(
            f"[{current}][v{index}]xfade=transition=fade:"
            f"duration={overlap / FPS:.8f}:offset={offset:.8f}[{next_label}]"
        )
        total_frames += clip_frames[index] - overlap
        current = next_label

    # The last decoded frame reaches black, including very short exports.
    fade_frames = min(TRANSITION_FRAMES, max(1, (total_frames - 1) // 2))
    filters.append(
        f"[{current}]fade=t=in:s=0:n={fade_frames},"
        f"fade=t=out:s={total_frames - 1 - fade_frames}:n={fade_frames},"
        "format=yuv420p[out]"
    )
    command.extend([
        "-filter_complex_threads", "1",
        "-filter_complex", ";".join(filters), "-map", "[out]",
        "-frames:v", str(total_frames), "-r", str(FPS),
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-threads", "2", "-pix_fmt", "yuv420p", "-an",
        "-movflags", "+faststart", str(output_path),
    ])
    run_ffmpeg(command)


def generate_video(
    scenes: list[VideoScene],
    aspect_ratio: VideoAspectRatio = "16:9",
    on_progress: ProgressCallback | None = None,
) -> str:
    if not scenes:
        raise ValueError("At least one scene is required.")
    if aspect_ratio not in OUTPUT_SIZES:
        raise ValueError("Aspect ratio must be 16:9 or 9:16.")
    clip_frames = [scene_frame_count(float(scene.duration)) for scene in scenes]
    motions = choose_motion_modes(len(scenes))
    job_id = str(uuid.uuid4())
    job_dir = TEMP_DIR / job_id
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    job_dir.mkdir(parents=True, exist_ok=True)
    output_path = GENERATED_DIR / f"{job_id}.mp4"
    clip_paths: list[Path] = []

    def report(completed_steps: int, message: str) -> None:
        if on_progress:
            on_progress(round(100 * completed_steps / (2 * len(scenes) + 1)), message)

    try:
        for index, (scene, motion) in enumerate(zip(scenes, motions)):
            image_path = job_dir / f"scene_{index + 1}.jpg"
            clip_path = job_dir / f"scene_{index + 1}.mp4"
            report(2 * index, f"Downloading image {index + 1} of {len(scenes)}")
            download_image(str(scene.image_url), image_path)
            report(
                2 * index + 1,
                f"Rendering scene {index + 1} of {len(scenes)} ({motion.replace('_', ' ')})",
            )
            create_scene_clip(
                image_path=image_path, output_path=clip_path,
                duration=float(scene.duration), motion=motion, aspect_ratio=aspect_ratio,
            )
            clip_paths.append(clip_path)

        report(2 * len(scenes), "Adding transitions and finishing the MP4")
        concatenate_clips(clip_paths, clip_frames, output_path)
        report(2 * len(scenes) + 1, "Video ready")
        return str(output_path)
    except Exception:
        output_path.unlink(missing_ok=True)
        raise
    finally:
        # This directory is created above under TEMP_DIR for this job only.
        shutil.rmtree(job_dir, ignore_errors=True)

