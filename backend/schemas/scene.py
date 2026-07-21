from pydantic import BaseModel, Field


class ScriptRequest(BaseModel):
    script: str = Field(min_length=1)


from pydantic import BaseModel

class Scene(BaseModel):
    scene_number: int
    narration: str
    keyword: str
    visual_description: str
    image_prompt: str
    estimated_duration: int


class SceneAnalysisResponse(BaseModel):
    scenes: list[Scene]