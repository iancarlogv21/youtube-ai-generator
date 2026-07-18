from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.scenes import router as scenes_router

app = FastAPI(
    title="AI YouTube Video Generator API",
    version="0.1.0",
)

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