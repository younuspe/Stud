export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type VideoAspectRatio = '16:9' | '9:16';

export interface ImageGenerationOptions {
  prompt: string;
  sourceImage?: string; // base64
  mimeType?: string;
  aspectRatio: ImageAspectRatio;
}

export interface ImageItem {
  id: string;
  url: string;
  prompt: string;
  isEdit: boolean;
  aspectRatio: ImageAspectRatio;
  createdAt: number;
}

export interface VideoGenerationOptions {
  image: string; // base64 data URI or clean base64
  mimeType: string;
  prompt?: string;
  aspectRatio: VideoAspectRatio; // strictly '16:9' or '9:16'
}

export interface VideoItem {
  id: string;
  operationName: string;
  videoUrl?: string;
  thumbnailUrl: string;
  prompt: string;
  aspectRatio: VideoAspectRatio;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  progressPercent: number;
  createdAt: number;
}
