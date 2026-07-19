import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

from schemas.scene import SceneAnalysisResponse


ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)


def get_ai_client() -> genai.Client:
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY was not found in backend/.env"
        )

    return genai.Client(api_key=api_key)


def test_ai_connection() -> str:
    client = get_ai_client()

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents="Reply exactly with: Gemini connection successful",
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    return response.text.strip()


def generate_scenes_with_ai(script: str) -> SceneAnalysisResponse:
    clean_script = script.strip()

    if not clean_script:
        raise ValueError("Script cannot be empty.")

    client = get_ai_client()

    prompt = f"""
You are a YouTube video scene planner.

Analyze the script and divide it into clear, logical video scenes.

Requirements:
- Preserve the original meaning of the script.
- Each scene must contain a natural narration segment.
- Create one short keyword representing the main visual subject.
- Write a detailed visual description suitable for finding or generating video footage.
- Estimate the duration in whole seconds.
- Use approximately 2 to 4 spoken words per second.
- Keep scenes short and visually focused.
- Number scenes starting from 1.

YouTube script:

{clean_script}
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_json_schema": (
                SceneAnalysisResponse.model_json_schema()
            ),
        },
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    return SceneAnalysisResponse.model_validate_json(response.text)