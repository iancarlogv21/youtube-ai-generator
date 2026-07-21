import type { ImageSearchResponse } from "../types/scene";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function searchImage(
  query: string
): Promise<ImageSearchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/images/search?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Failed to search image.");
  }

  return response.json();
}