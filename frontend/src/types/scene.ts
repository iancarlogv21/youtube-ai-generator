export type Scene = {
  scene_number: number;
  narration: string;
  keyword: string;
  visual_description: string;
  image_prompt: string;
  estimated_duration: number;
};

export type SceneAnalysisResponse = {
  scenes: Scene[];
};