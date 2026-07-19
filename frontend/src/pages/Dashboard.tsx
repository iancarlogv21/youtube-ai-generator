import { useState } from "react";

import SceneList from "../components/SceneList";
import ScriptForm from "../components/ScriptForm";
import { analyzeScript } from "../services/api";
import type { Scene } from "../types/scene";

function Dashboard() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleAnalyze(script: string) {
    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      const result = await analyzeScript(script);

      setScenes(result.scenes);

      setSuccessMessage(
        `${result.scenes.length} ${
          result.scenes.length === 1 ? "scene was" : "scenes were"
        } generated successfully.`,
      );
    } catch (err) {
      setScenes([]);
      setSuccessMessage("");

      setError(
        err instanceof Error
          ? err.message
          : "Something unexpected happened. Please try again.",
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

    setSuccessMessage("");
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

    setSuccessMessage("");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            AI Media Platform
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            AI YouTube Video Generator
          </h1>

          <p className="mt-3 text-slate-400">
            Paste a script and automatically transform it into editable
            video scenes.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <ScriptForm
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
            />
          </aside>

          <section className="min-w-0">
            {isLoading && (
              <div className="mb-5 rounded-xl border border-blue-900 bg-blue-950/50 p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-6 w-6 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />

                  <div>
                    <h2 className="font-semibold text-blue-200">
                      Gemini is analyzing your script
                    </h2>

                    <p className="mt-1 text-sm text-blue-300/80">
                      Creating narration segments, keywords, visual
                      descriptions, and estimated durations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-800 bg-red-950/60 p-5"
              >
                <h2 className="font-semibold text-red-200">
                  Scene generation failed
                </h2>

                <p className="mt-1 text-sm text-red-300">
                  {error}
                </p>

                <p className="mt-3 text-xs text-red-400">
                  Make sure the backend is running, then try again.
                </p>
              </div>
            )}

            {successMessage && !isLoading && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-emerald-800 bg-emerald-950/50 p-5"
              >
                <h2 className="font-semibold text-emerald-200">
                  Scenes generated successfully
                </h2>

                <p className="mt-1 text-sm text-emerald-300">
                  {successMessage}
                </p>
              </div>
            )}

            <div className="max-h-[calc(100vh-3rem)] overflow-y-auto pr-2">
              <SceneList
                scenes={scenes}
                onUpdateScene={handleUpdateScene}
                onDeleteScene={handleDeleteScene}
                onAddScene={handleAddScene}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;