export type ImageSearchResponse = {
  image_url: string;
  photographer: string;
  photographer_url: string;
  source: string;
};

export type Scene = {
  scene_number: number;
  narration: string;
  keyword: string;
  visual_description: string;
  image_prompt: string;
  estimated_duration: number;
  image?: ImageSearchResponse;
};

export type SceneAnalysisResponse = {
  scenes: Scene[];
};