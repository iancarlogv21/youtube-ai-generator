import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai


ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)


def get_ai_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY was not found in backend/.env"
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