export interface Chapter {
  time: number; // in seconds
  title: string;
}

export interface MediaMetadata {
  title: string;
  author: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  sourceUrl: string;
  type: 'video' | 'audio';
  chapters: Chapter[];
  summary: string;
  tags: string[];
  formats: MediaFormat[];
}

export interface MediaFormat {
  id: string;
  quality: string;
  ext: 'mp4' | 'mp3' | 'wav' | 'aac';
  size: string;
  bitrate?: string;
}

export interface ConversionConfig {
  formatId: string;
  startTime: number;
  endTime: number;
  volumeBoost: number; // 0.5 to 2.0 (e.g. 1.0 is 100%)
  playbackSpeed: number; // 0.5 to 2.0 (e.g. 1.0 is normal)
  vocalIsolate: boolean;
  bassBoost: boolean;
}

export interface TranscodeStatus {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 to 100
  message: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: string;
}
