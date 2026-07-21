from fastapi import FastAPI
from routers import images
from fastapi.middleware.cors import CORSMiddleware

from routers.scenes import router as scenes_router

from services.ai_service import test_ai_connection

from fastapi import HTTPException

app = FastAPI(
    title="AI YouTube Video Generator API",
    version="0.1.0",
)

app.include_router(images.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scenes_router)

  
@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "AI YouTube Video Generator API is running"
    }


@app.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "healthy"
    }

@app.get("/api/ai/test")
def test_ai():
    try:
        return {
            "message": test_ai_connection()
        }
    except Exception as error:
        print(f"Gemini error: {type(error).__name__}: {error}")

        raise HTTPException(
            status_code=500,
            detail=f"{type(error).__name__}: {error}"
        )