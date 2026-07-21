import httpx
from fastapi import APIRouter, HTTPException, Query

from schemas.image import ImageSearchResponse
from services.image_service import search_image


router = APIRouter(
    prefix="/api/images",
    tags=["Images"]
)


@router.get("/search", response_model=ImageSearchResponse)
async def search_image_route(
    query: str = Query(..., min_length=2)
) -> ImageSearchResponse:
    try:
        return await search_image(query)

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except httpx.HTTPStatusError as error:
        status_code = error.response.status_code

        if status_code in {401, 403}:
            detail = "Pexels API key is invalid or unauthorized."
        elif status_code == 429:
            detail = "Pexels API request limit has been reached."
        else:
            detail = "Pexels returned an error."

        raise HTTPException(
            status_code=502,
            detail=detail
        ) from error

    except httpx.RequestError as error:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to Pexels."
        ) from error