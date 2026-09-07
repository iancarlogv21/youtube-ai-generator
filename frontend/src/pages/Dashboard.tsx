import { useEffect, useRef, useState } from "react";

import SceneList from "../components/SceneList";
import ScriptForm from "../components/ScriptForm";

import { analyzeScript } from "../services/api";
import { searchImage } from "../services/imageApi";
import { generateVideo } from "../services/videoApi";
import type { VideoAspectRatio, VideoJob } from "../services/videoApi";

import type { Scene } from "../types/scene";


function Dashboard() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isGeneratingVideo, setIsGeneratingVideo] =
    useState(false);

  const [videoUrl, setVideoUrl] =
    useState<string | null>(null);

  const [videoError, setVideoError] =
    useState<string | null>(null);


  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [renderProgress, setRenderProgress] = useState<VideoJob | null>(null);
  const sceneRevision = useRef(0);
  const renderController = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => renderController.current?.abort();
  }, []);

  function invalidateVideo() {
    sceneRevision.current += 1;
    setVideoUrl(null);
    setVideoError(null);
  }

  async function handleAnalyze(script: string) {
    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");
      invalidateVideo();

      const result = await analyzeScript(script);

      // Display scenes immediately while images are loading.
      setScenes(result.scenes);

      const scenesWithImages = await Promise.all(
        result.scenes.map(async (scene) => {
          try {
            const searchQuery =
              `${scene.keyword} ${scene.image_prompt}`
                .trim()
                .slice(0, 160);

            const image = await searchImage(searchQuery);

            return {
              ...scene,
              image,
            };
          } catch (imageError) {
            console.error(
              `Failed to load image for scene ${scene.scene_number}:`,
              imageError,
            );

            // Keep the scene even when image loading fails.
            return scene;
          }
        }),
      );

      setScenes(scenesWithImages);

      setSuccessMessage(
        `${result.scenes.length} ${
          result.scenes.length === 1
            ? "scene was"
            : "scenes were"
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

    // A pending render must not restore a preview of older scenes.
    invalidateVideo();
  }


  function handleDeleteScene(sceneNumber: number) {
    setScenes((currentScenes) =>
      currentScenes
        .filter(
          (scene) => scene.scene_number !== sceneNumber,
        )
        .map((scene, index) => ({
          ...scene,
          scene_number: index + 1,
        })),
    );

    setSuccessMessage("");
    invalidateVideo();
  }


  function handleAddScene() {
    const newScene: Scene = {
      scene_number: scenes.length + 1,
      keyword: "",
      narration: "",
      visual_description: "",
      image_prompt: "",
      estimated_duration: 5,
    };

    setScenes((currentScenes) => [
      ...currentScenes,
      newScene,
    ]);

    setSuccessMessage("");
    invalidateVideo();
  }


  async function handleGenerateVideo() {
    setVideoError(null);
    setVideoUrl(null);

    if (scenes.length === 0) {
      setVideoError(
        "Generate at least one scene before creating a video.",
      );
      return;
    }

    const scenesWithImages = scenes.filter(
      (scene) => Boolean(scene.image?.image_url),
    );

    if (scenesWithImages.length !== scenes.length) {
      setVideoError(
        "Every scene must have an image before generating the video.",
      );
      return;
    }

    const revision = sceneRevision.current;
    const controller = new AbortController();
    renderController.current = controller;
    setRenderProgress(null);
    setIsGeneratingVideo(true);

    try {
      const videoScenes = scenesWithImages.map((scene) => ({
        image_url: scene.image!.image_url,
        duration:
          Number(scene.estimated_duration) > 0
            ? Number(scene.estimated_duration)
            : 5,
      }));

      const result = await generateVideo(videoScenes, {
        aspectRatio,
        signal: controller.signal,
        onProgress: (job) => {
          if (sceneRevision.current === revision) {
            setRenderProgress(job);
          }
        },
      });

      if (sceneRevision.current === revision) {
        setVideoUrl(result.video_url);
      } else {
        setVideoError("Scenes changed during rendering. Generate the video again.");
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setVideoError(
          err instanceof Error
            ? err.message
            : "An unknown video generation error occurred.",
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsGeneratingVideo(false);
        renderController.current = null;
      }
    }
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
            Paste a script and automatically transform it
            into editable video scenes.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <fieldset disabled={isGeneratingVideo} className="m-0 min-w-0 border-0 p-0">
              <ScriptForm
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
              />
            </fieldset>
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
                      Creating narration segments, keywords,
                      visual descriptions, image prompts, and
                      estimated durations.
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
                  Make sure the backend is running, then try
                  again.
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
              <fieldset
                disabled={isLoading || isGeneratingVideo}
                className="m-0 min-w-0 border-0 p-0 disabled:opacity-70"
              >
                <SceneList
                  scenes={scenes}
                  onUpdateScene={handleUpdateScene}
                  onDeleteScene={handleDeleteScene}
                  onAddScene={handleAddScene}
                />
              </fieldset>

              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Video Export
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Create an MP4 with varied camera motion,
                      smooth transitions, and opening and closing fades.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateVideo}
                    disabled={
                      isGeneratingVideo ||
                      isLoading ||
                      scenes.length === 0
                    }
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGeneratingVideo
                      ? "Rendering Video..."
                      : "Generate Video"}
                  </button>
                </div>

                <div className="mt-5">
                  <label htmlFor="video-format" className="mb-2 block text-sm font-medium text-slate-200">
                    Output format
                  </label>
                  <select
                    id="video-format"
                    value={aspectRatio}
                    disabled={isGeneratingVideo}
                    onChange={(event) => {
                      setAspectRatio(event.target.value as VideoAspectRatio);
                      invalidateVideo();
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white disabled:opacity-60"
                  >
                    <option value="16:9">Landscape 16:9 (1280 x 720)</option>
                    <option value="9:16">Shorts / TikTok 9:16 (1080 x 1920)</option>
                  </select>
                  <p className="mt-2 text-xs text-slate-400">
                    Images are cropped to fill the selected frame. Transitions
                    overlap scenes by up to 0.5 seconds, slightly shortening the video.
                  </p>
                </div>

                {isGeneratingVideo && (
                  <div className="mt-5" role="status" aria-live="polite">
                    <progress
                      value={renderProgress?.progress ?? 0}
                      max={100}
                      aria-label="Video rendering progress"
                      className="h-2 w-full accent-blue-500"
                    />
                    <p className="mt-2 text-sm text-slate-300">
                      {renderProgress?.message ?? "Starting video render..."}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {renderProgress?.progress ?? 0}% of render steps completed.
                      Scene editing will be available when rendering finishes.
                    </p>
                  </div>
                )}

                {videoError && (
                  <div
                    role="alert"
                    className="mt-5 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300"
                  >
                    {videoError}
                  </div>
                )}

                {videoUrl && (
                  <div className="mt-5 space-y-4">
                    <video
                      src={videoUrl}
                      controls
                      style={{ aspectRatio: aspectRatio === "9:16" ? "9 / 16" : "16 / 9" }}
                      className={`w-full rounded-lg bg-black ${aspectRatio === "9:16" ? "mx-auto max-w-sm" : ""}`}
                    >
                      Your browser does not support the video
                      element.
                    </video>

                    <a
                      href={videoUrl}
                      download
                      className="inline-flex rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Download Video
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}


export default Dashboard;