from fastapi import APIRouter, HTTPException

from schemas.scene import ScriptRequest, SceneAnalysisResponse
from services.ai_service import generate_scenes_with_ai


router = APIRouter(
    prefix="/api/scenes",
    tags=["Scenes"],
)


@router.post(
    "/analyze",
    response_model=SceneAnalysisResponse,
)
def analyze_script(
    request: ScriptRequest,
) -> SceneAnalysisResponse:
    try:
        return generate_scenes_with_ai(request.script)

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            f"AI scene generation error: "
            f"{type(error).__name__}: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate scenes using AI.",
        ) from error