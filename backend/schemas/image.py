from pydantic import BaseModel


class ImageSearchResponse(BaseModel):
    image_url: str
    photographer: str
    photographer_url: str
    source: str