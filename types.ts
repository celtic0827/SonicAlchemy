
export interface Track {
  id: string;
  title: string;
  coverUrl: string;
  prompt: string;
  tags: string[];
  createdAt: number;
  audioUrl?: string;
}

export interface TagStat {
  tag: string;
  count: number;
}

export type ViewState = 'library' | 'track-detail' | 'mixing-room';

export interface MixingResult {
  commonTags: string[];
  randomTags: string[];
  finalPrompt: string;
  generatedAt: number;
}
