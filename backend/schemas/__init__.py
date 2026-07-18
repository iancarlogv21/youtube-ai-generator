from pydantic import BaseModel, Field


class ScriptRequest(BaseModel):
    script: str = Field(min_length=1)


class Scene(BaseModel):
    scene_number: int
    text: str
    keyword: str
    estimated_duration: int


class SceneAnalysisResponse(BaseModel):
    scenes: list[Scene]