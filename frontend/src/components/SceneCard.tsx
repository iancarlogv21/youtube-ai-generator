import type { Scene } from "../types/scene";

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