import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

from schemas.image import ImageSearchResponse


ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

if not PEXELS_API_KEY:
    raise ValueError("PEXELS_API_KEY is missing from .env")


PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search"


async def search_image(query: str) -> ImageSearchResponse:
    headers = {
        "Authorization": PEXELS_API_KEY
    }

    params = {
        "query": query,
        "per_page": 1,
        "orientation": "landscape"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            PEXELS_SEARCH_URL,
            headers=headers,
            params=params
        )

        response.raise_for_status()
        data = response.json()

    photos = data.get("photos", [])

    if not photos:
        raise ValueError(f"No image found for: {query}")

    photo = photos[0]

    return ImageSearchResponse(
        image_url=photo["src"]["large"],
        photographer=photo["photographer"],
        photographer_url=photo["photographer_url"],
        source="Pexels"
    )