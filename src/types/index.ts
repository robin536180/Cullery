export interface Face {
  id: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  name?: string;
}

export interface PhotoMetadata {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number; // in bytes
  width: number;
  height: number;
  creationDate: string; // ISO string
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  hash: string;
  type: 'photo' | 'screenshot' | 'video' | 'document';
  thumbnailUrl: string; // For web demo
  aiAnalysis?: {
    qualityScore: number;
    blurScore: number;
    exposureScore: number;
    compositionScore: number;
    emotionScore: number;
    sceneCategory: string;
    faces: Face[];
  };
}

export interface SimilarityCluster {
  id: string;
  photos: PhotoMetadata[];
  clusterType: 'duplicate' | 'similar' | 'burst';
  bestPhotoId: string;
  recommendedDeletions: string[];
}

export interface AICleanupSuggestion {
  duplicates: SimilarityCluster[];
  screenshots: PhotoMetadata[];
  lowQuality: PhotoMetadata[];
  totalSpaceReclaimable: number;
  confidence: number;
}

export interface ProfessionalSelection {
  photo: PhotoMetadata;
  scores: {
    sharpness: number;
    exposure: number;
    composition: number;
    color: number;
    moment: number;
  };
  recommendation: 'keep' | 'delete' | 'review';
  reasoning: string;
}
