import type { SceneAnalysisResponse } from "../types/scene";

const API_BASE_URL = "http://127.0.0.1:8000";

type ApiErrorResponse = {
  detail?: string;
};

export async function analyzeScript(
  script: string,
): Promise<SceneAnalysisResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/scenes/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script,
        }),
      },
    );

    if (!response.ok) {
      let message = "Failed to generate scenes.";

      try {
        const errorData =
          (await response.json()) as ApiErrorResponse;

        if (errorData.detail) {
          message = errorData.detail;
        }
      } catch {
        // The server did not return JSON.
      }

      throw new Error(message);
    }

    return (await response.json()) as SceneAnalysisResponse;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Cannot connect to the backend. Make sure FastAPI is running on port 8000.",
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("An unexpected network error occurred.");
  }
}