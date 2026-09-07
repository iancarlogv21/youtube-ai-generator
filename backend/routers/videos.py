import logging
from pathlib import Path
from threading import Lock
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from schemas.video import (
    VideoGenerationRequest, VideoGenerationResponse, VideoJobResponse,
)
from services.video_service import generate_video


router = APIRouter(prefix="/api/videos", tags=["Videos"])
logger = logging.getLogger(__name__)

# A small single-process job store for the local development server.
# Keep only 100 recent jobs; restarting the backend clears progress history.
_jobs: dict[str, VideoJobResponse] = {}
_jobs_lock = Lock()
_render_lock = Lock()


def video_url(request: Request, video_path: str) -> str:
    return str(request.url_for("generated-videos", path=Path(video_path).name))


@router.post("/generate", response_model=VideoGenerationResponse)
def generate(payload: VideoGenerationRequest, request: Request):
    """Keep the original synchronous endpoint for existing API clients."""
    if not _render_lock.acquire(blocking=False):
        raise HTTPException(409, "A video is already rendering. Try again when it finishes.")
    try:
        path = generate_video(payload.scenes, aspect_ratio=payload.aspect_ratio)
        return VideoGenerationResponse(video_url=video_url(request, path))
    except Exception as error:
        logger.exception("Video generation failed")
        raise HTTPException(500, str(error)) from error
    finally:
        _render_lock.release()


def render_job(job_id: str, payload: VideoGenerationRequest, output_base_url: str) -> None:
    def update(progress: int, message: str) -> None:
        with _jobs_lock:
            _jobs[job_id] = _jobs[job_id].model_copy(update={
                "status": "rendering", "progress": min(progress, 99), "message": message,
            })

    try:
        path = generate_video(
            payload.scenes, aspect_ratio=payload.aspect_ratio, on_progress=update,
        )
        with _jobs_lock:
            _jobs[job_id] = _jobs[job_id].model_copy(update={
                "status": "completed", "progress": 100, "message": "Video ready",
                "video_url": output_base_url + Path(path).name,
            })
    except Exception as error:
        logger.exception("Video job %s failed", job_id)
        with _jobs_lock:
            _jobs[job_id] = _jobs[job_id].model_copy(update={
                "status": "failed", "message": "Video generation failed",
                "error": str(error),
            })
    finally:
        _render_lock.release()


@router.post("/jobs", response_model=VideoJobResponse, status_code=202)
def start_job(
    payload: VideoGenerationRequest, request: Request, background_tasks: BackgroundTasks,
):
    if not _render_lock.acquire(blocking=False):
        raise HTTPException(409, "A video is already rendering. Try again when it finishes.")
    try:
        job = VideoJobResponse(
            job_id=str(uuid.uuid4()), status="queued", progress=0,
            message="Preparing video render",
        )
        with _jobs_lock:
            while len(_jobs) >= 100:
                del _jobs[next(iter(_jobs))]
            _jobs[job.job_id] = job
        output_base_url = str(request.url_for("generated-videos", path=""))
        background_tasks.add_task(render_job, job.job_id, payload, output_base_url)
        return job
    except Exception:
        _render_lock.release()
        raise


@router.get("/jobs/{job_id}", response_model=VideoJobResponse)
def get_job(job_id: str):
    with _jobs_lock:
        job = _jobs.get(job_id)
    if job is None:
        raise HTTPException(
            404, "Render job not found. The backend may have restarted. Generate the video again.",
        )
    return job

