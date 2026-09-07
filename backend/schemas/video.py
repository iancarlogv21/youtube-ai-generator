from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


VideoAspectRatio = Literal["16:9", "9:16"]


class VideoScene(BaseModel):
    image_url: HttpUrl
    duration: float = Field(ge=0.1, le=120, allow_inf_nan=False)


class VideoGenerationRequest(BaseModel):
    scenes: list[VideoScene] = Field(min_length=1, max_length=50)
    aspect_ratio: VideoAspectRatio = "16:9"


class VideoGenerationResponse(BaseModel):
    video_url: str


class VideoJobResponse(BaseModel):
    job_id: str
    status: Literal["queued", "rendering", "completed", "failed"]
    progress: int = Field(ge=0, le=100)
    message: str
    video_url: str | None = None
    error: str | None = None

