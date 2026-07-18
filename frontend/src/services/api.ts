import type { SceneAnalysisResponse } from "../types/scene";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function analyzeScript(
  script: string,
): Promise<SceneAnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/scenes/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      script,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze script.");
  }

  return response.json();
}