import SceneCard from "./SceneCard";
import type { Scene } from "../types/scene";

type SceneListProps = {
  scenes: Scene[];
  onUpdateScene: (sceneNumber: number, updatedScene: Scene) => void;
  onDeleteScene: (sceneNumber: number) => void;
  onAddScene: () => void;
};

function SceneList({
  scenes,
  onUpdateScene,
  onDeleteScene,
  onAddScene,
}: SceneListProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Scene Editor
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {scenes.length} {scenes.length === 1 ? "scene" : "scenes"}
          </p>
        </div>

        <button
          type="button"
          onClick={onAddScene}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-500"
        >
          + Add Scene
        </button>
      </div>

      {scenes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
          <p className="text-slate-400">
            No scenes yet. Analyze a script or add a new scene.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {scenes.map((scene) => (
            <SceneCard
              key={scene.scene_number}
              scene={scene}
              onUpdateScene={onUpdateScene}
              onDeleteScene={onDeleteScene}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default SceneList;