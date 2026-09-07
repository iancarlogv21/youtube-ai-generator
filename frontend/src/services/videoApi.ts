export type VideoAspectRatio = "16:9" | "9:16";

export type VideoSceneRequest = {
  image_url: string;
  duration: number;
};

export type GenerateVideoResponse = {
  video_url: string;
};

export type VideoJob = {
  job_id: string;
  status: "queued" | "rendering" | "completed" | "failed";
  progress: number;
  message: string;
  video_url: string | null;
  error: string | null;
};

type GenerateVideoOptions = {
  aspectRatio?: VideoAspectRatio;
  onProgress?: (job: VideoJob) => void;
  signal?: AbortSignal;
};

const VIDEO_API_URL = "http://127.0.0.1:8000/api/videos";

async function readResponse(response: Response): Promise<VideoJob> {
  if (!response.ok) {
    let message = "Failed to generate video.";
    try {
      const data = await response.json();
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail
          .map((item: { msg?: string }) => item.msg ?? "Invalid video settings.")
          .join(" ");
      }
    } catch {
      // Keep the default error message if the server did not return JSON.
    }
    throw new Error(message);
  }
  return response.json();
}

function waitForNextPoll(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Render polling stopped.", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, 1000);
    function abort() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(new DOMException("Render polling stopped.", "AbortError"));
    }
    signal?.addEventListener("abort", abort, { once: true });
  });
}

export async function generateVideo(
  scenes: VideoSceneRequest[],
  { aspectRatio = "16:9", onProgress, signal }: GenerateVideoOptions = {},
): Promise<GenerateVideoResponse> {
  let job = await readResponse(await fetch(`${VIDEO_API_URL}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenes, aspect_ratio: aspectRatio }),
    signal,
  }));

  while (true) {
    signal?.throwIfAborted();
    onProgress?.(job);
    if (job.status === "failed") {
      throw new Error(job.error || "Video generation failed.");
    }
    if (job.status === "completed") {
      if (!job.video_url) {
        throw new Error("The completed render did not return a video URL.");
      }
      return { video_url: job.video_url };
    }
    await waitForNextPoll(signal);
    job = await readResponse(await fetch(
      `${VIDEO_API_URL}/jobs/${encodeURIComponent(job.job_id)}`,
      { signal },
    ));
  }
}

