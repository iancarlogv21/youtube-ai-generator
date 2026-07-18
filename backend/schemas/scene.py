from pydantic import BaseModel, Field


class ScriptRequest(BaseModel):
    script: str = Field(min_length=1)


class Scene(BaseModel):
    scene_number: int
    narration: str
    keyword: str
    visual_description: str
    estimated_duration: int


class SceneAnalysisResponse(BaseModel):
    scenes: list[Scene]