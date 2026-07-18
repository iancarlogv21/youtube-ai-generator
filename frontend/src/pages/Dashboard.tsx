import { useState } from "react";

import SceneList from "../components/SceneList";
import ScriptForm from "../components/ScriptForm";
import { analyzeScript } from "../services/api";
import type { Scene } from "../types/scene";

function Dashboard() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze(script: string) {
    try {
      setIsLoading(true);
      setError("");

      const result = await analyzeScript(script);

      setScenes(result.scenes);
    } catch (err) {
      setScenes([]);

      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleUpdateScene(
  sceneNumber: number,
  updatedScene: Scene,
) {
  setScenes((currentScenes) =>
    currentScenes.map((scene) =>
      scene.scene_number === sceneNumber
        ? updatedScene
        : scene,
    ),
  );
}

  function handleDeleteScene(sceneNumber: number) {
  setScenes((currentScenes) =>
    currentScenes
      .filter((scene) => scene.scene_number !== sceneNumber)
      .map((scene, index) => ({
        ...scene,
        scene_number: index + 1,
      })),
  );
}

function handleAddScene() {
  const newScene: Scene = {
    scene_number: scenes.length + 1,
    keyword: "",
    narration: "",
    visual_description: "",
    estimated_duration: 3,
  };

  setScenes((currentScenes) => [
    ...currentScenes,
    newScene,
  ]);
}

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            AI Media Platform
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            AI YouTube Video Generator
          </h1>

          <p className="mt-3 text-slate-400">
            Paste a script and automatically break it into video scenes.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <ScriptForm
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />

          <div>
            {error && (
              <div className="mb-4 rounded-xl border border-red-800 bg-red-950 p-4 text-red-300">
                {error}
              </div>
            )}

            <SceneList
              scenes={scenes}
              onUpdateScene={handleUpdateScene}
              onDeleteScene={handleDeleteScene}
              onAddScene={handleAddScene}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;