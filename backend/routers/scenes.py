from fastapi import APIRouter

from schemas.scene import ScriptRequest, SceneAnalysisResponse
from services.scene_service import analyze_script

router = APIRouter(
    prefix="/api/scenes",
    tags=["Scenes"],
)


@router.post("/analyze", response_model=SceneAnalysisResponse)
def analyze_scene_script(request: ScriptRequest) -> SceneAnalysisResponse:
    scenes = analyze_script(request.script)
    return SceneAnalysisResponse(scenes=scenes)