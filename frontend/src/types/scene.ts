export type Scene = {
  scene_number: number;
  narration: string;
  keyword: string;
  visual_description: string;
  estimated_duration: number;
};

export type SceneAnalysisResponse = {
  scenes: Scene[];
};