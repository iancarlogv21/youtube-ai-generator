import { useState } from "react";

import { searchImage } from "../services/imageApi";
import type { ImageSearchResponse, Scene } from "../types/scene";

type SceneCardProps = {
  scene: Scene;
  onUpdateScene: (sceneNumber: number, updatedScene: Scene) => void;
  onDeleteScene: (sceneNumber: number) => void;
};

function SceneCard({
  scene,
  onUpdateScene,
  onDeleteScene,
}: SceneCardProps) {
  const [imageResult, setImageResult] =
    useState<ImageSearchResponse | null>(null);

  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  async function handleSearchImage() {
    const query = scene.keyword.trim() || scene.image_prompt.trim();

    if (!query) {
      setImageError("Add a keyword or image prompt first.");
      return;
    }

    try {
      setIsSearchingImage(true);
      setImageError("");

      const result = await searchImage(query);
      setImageResult(result);
    } catch (error) {
      console.error(error);
      setImageError("Failed to find an image for this scene.");
    } finally {
      setIsSearchingImage(false);
    }
  }

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">
          Scene {scene.scene_number}
        </h3>

        <button
          type="button"
          onClick={() => onDeleteScene(scene.scene_number)}
          className="rounded-lg border border-red-900 px-3 py-2 text-sm font-semibold text-red-300"
        >
          Delete
        </button>
      </div>

      {imageResult && (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <img
            src={imageResult.image_url}
            alt={`Scene ${scene.scene_number} preview`}
            className="aspect-video w-full object-cover"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-slate-400">
            <span>
              Photo by{" "}
              <a
                href={imageResult.photographer_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-blue-400 hover:underline"
              >
                {imageResult.photographer}
              </a>
            </span>

            <span>Source: {imageResult.source}</span>
          </div>
        </div>
      )}

      <div className="mt-5">
        <label className="mb-2 block text-xs uppercase text-slate-500">
          Keyword
        </label>

        <input
          type="text"
          value={scene.keyword}
          onChange={(event) =>
            onUpdateScene(scene.scene_number, {
              ...scene,
              keyword: event.target.value,
            })
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
        />
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-xs uppercase text-slate-500">
          Narration
        </label>

        <textarea
          value={scene.narration}
          onChange={(event) =>
            onUpdateScene(scene.scene_number, {
              ...scene,
              narration: event.target.value,
            })
          }
          rows={4}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
        />
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-xs uppercase text-slate-500">
          Visual Description
        </label>

        <textarea
          value={scene.visual_description}
          onChange={(event) =>
            onUpdateScene(scene.scene_number, {
              ...scene,
              visual_description: event.target.value,
            })
          }
          rows={4}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
        />
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-xs uppercase text-slate-500">
          Image Prompt
        </label>

        <textarea
          value={scene.image_prompt}
          onChange={(event) =>
            onUpdateScene(scene.scene_number, {
              ...scene,
              image_prompt: event.target.value,
            })
          }
          rows={4}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
        />

        <button
          type="button"
          onClick={handleSearchImage}
          disabled={isSearchingImage}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSearchingImage ? "Searching..." : "Search Image"}
        </button>

        {imageError && (
          <p className="mt-2 text-sm text-red-400">{imageError}</p>
        )}
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-xs uppercase text-slate-500">
          Duration in seconds
        </label>

        <input
          type="number"
          min={1}
          value={scene.estimated_duration}
          onChange={(event) =>
            onUpdateScene(scene.scene_number, {
              ...scene,
              estimated_duration: Number(event.target.value),
            })
          }
          className="w-32 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white"
        />
      </div>
    </article>
  );
}

export default SceneCard;