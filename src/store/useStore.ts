import { create } from 'zustand';
import { PhotoMetadata, AICleanupSuggestion, SimilarityCluster, ProfessionalSelection } from '../types';
import { NativeService } from '../services/native';

interface AppState {
  photos: PhotoMetadata[];
  cleanupSuggestions: AICleanupSuggestion | null;
  selectedCluster: SimilarityCluster | null;
  professionalSelections: Record<string, ProfessionalSelection>; // photoId -> selection
  recycleBin: PhotoMetadata[];
  storageStats: {
    totalPhotos: number;
    usedSpace: number; // in GB
    screenshotsSize: number;
    duplicatesSize: number;
    videosSize: number;
  };
  isLoading: boolean;
  
  // Actions
  initializeAppData: () => void;
  loadPhotosFromLibrary: () => Promise<void>;
  deletePhoto: (id: string) => void;
  deletePhotos: (ids: string[]) => void;
  restorePhoto: (id: string) => void;
  selectCluster: (cluster: SimilarityCluster) => void;
}

// Mock Data Generators
const generateMockPhotos = (count: number): PhotoMetadata[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `photo-${i}`,
    filePath: `/storage/emulated/0/DCIM/Camera/IMG_20240112_${i}.jpg`,
    fileName: `IMG_20240112_${i}.jpg`,
    fileSize: 2 * 1024 * 1024 + Math.random() * 5 * 1024 * 1024, // 2-7 MB
    width: 4032,
    height: 3024,
    creationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    hash: `hash-${i}`,
    type: Math.random() > 0.8 ? 'screenshot' : 'photo',
    thumbnailUrl: `https://picsum.photos/seed/${i}/400/300`, // Use lorem picsum for demo
    aiAnalysis: {
      qualityScore: Math.floor(Math.random() * 100),
      blurScore: Math.floor(Math.random() * 100),
      exposureScore: Math.floor(Math.random() * 100),
      compositionScore: Math.floor(Math.random() * 100),
      emotionScore: Math.floor(Math.random() * 100),
      sceneCategory: ['Landscape', 'Portrait', 'Food', 'Document'][Math.floor(Math.random() * 4)],
      faces: []
    }
  }));
};

const emptyCleanupSuggestions = (): AICleanupSuggestion => ({
  duplicates: [],
  screenshots: [],
  lowQuality: [],
  totalSpaceReclaimable: 0,
  confidence: 1,
});

const buildStorageStats = (photos: PhotoMetadata[]) => {
  const totalSize = photos.reduce((acc, photo) => acc + photo.fileSize, 0);
  const screenshots = photos.filter((photo) => photo.type === 'screenshot');
  const screenshotsSize = screenshots.reduce((acc, photo) => acc + photo.fileSize, 0);

  return {
    totalPhotos: photos.length,
    usedSpace: totalSize / (1024 * 1024 * 1024),
    screenshotsSize: screenshotsSize / (1024 * 1024 * 1024),
    duplicatesSize: 0,
    videosSize: 0,
  };
};

const buildSimilarityClusters = (photos: PhotoMetadata[]): SimilarityCluster[] => {
  const candidates = photos.filter((photo) => photo.type === 'photo');
  const clusters: SimilarityCluster[] = [];

  for (let index = 0; index + 2 < candidates.length && clusters.length < 5; index += 3) {
    const clusterPhotos = candidates.slice(index, index + 3);
    if (clusterPhotos.length < 2) continue;

    const sortedPhotos = [...clusterPhotos].sort(
      (left, right) => (right.aiAnalysis?.qualityScore || 0) - (left.aiAnalysis?.qualityScore || 0)
    );

    clusters.push({
      id: `cluster-${index}`,
      photos: clusterPhotos,
      clusterType: 'similar',
      bestPhotoId: sortedPhotos[0].id,
      recommendedDeletions: sortedPhotos.slice(1).map((photo) => photo.id),
    });
  }

  return clusters;
};

const buildCleanupSuggestions = (photos: PhotoMetadata[]): AICleanupSuggestion => {
  if (photos.length === 0) {
    return emptyCleanupSuggestions();
  }

  const duplicates = buildSimilarityClusters(photos);
  const screenshots = photos.filter((photo) => photo.type === 'screenshot');
  const lowQuality = photos.filter((photo) => (photo.aiAnalysis?.qualityScore || 100) < 45);
  const duplicateBytes = duplicates
    .flatMap((cluster) => cluster.photos.filter((photo) => cluster.recommendedDeletions.includes(photo.id)))
    .reduce((acc, photo) => acc + photo.fileSize, 0);
  const screenshotBytes = screenshots.reduce((acc, photo) => acc + photo.fileSize, 0);

  return {
    duplicates,
    screenshots,
    lowQuality,
    totalSpaceReclaimable: (duplicateBytes + screenshotBytes) / (1024 * 1024 * 1024),
    confidence: 0.9,
  };
};

const deriveState = (photos: PhotoMetadata[]) => {
  const cleanupSuggestions = buildCleanupSuggestions(photos);
  const duplicateBytes = cleanupSuggestions.duplicates
    .flatMap((cluster) => cluster.photos.filter((photo) => cluster.recommendedDeletions.includes(photo.id)))
    .reduce((acc, photo) => acc + photo.fileSize, 0);

  return {
    cleanupSuggestions,
    storageStats: {
      ...buildStorageStats(photos),
      duplicatesSize: duplicateBytes / (1024 * 1024 * 1024),
    },
  };
};

export const useStore = create<AppState>((set) => ({
  photos: [],
  cleanupSuggestions: null,
  selectedCluster: null,
  professionalSelections: {},
  recycleBin: [],
  storageStats: {
    totalPhotos: 0,
    usedSpace: 0,
    screenshotsSize: 0,
    duplicatesSize: 0,
    videosSize: 0,
  },
  isLoading: false,

  initializeAppData: () => {
    set({ isLoading: true });

    setTimeout(() => {
      const photos = NativeService.isNative ? [] : generateMockPhotos(50);

      set({
        photos,
        ...deriveState(photos),
        isLoading: false,
      });
    }, 1000);
  },

  loadPhotosFromLibrary: async () => {
    set({ isLoading: true });

    try {
      const photos = await NativeService.getPhotos();

      if (photos.length === 0) {
        set({ isLoading: false });
        return;
      }

      set({
        photos,
        ...deriveState(photos),
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load photos from library', error);
      set({ isLoading: false });
    }
  },

  deletePhoto: (id) =>
    set((state) => {
      const target = state.photos.find((photo) => photo.id === id);
      const photos = state.photos.filter((photo) => photo.id !== id);

      return {
        photos,
        recycleBin: target ? [target, ...state.recycleBin] : state.recycleBin,
        ...deriveState(photos),
      };
    }),

  deletePhotos: (ids) =>
    set((state) => {
      const deletedPhotos = state.photos.filter((photo) => ids.includes(photo.id));
      const photos = state.photos.filter((photo) => !ids.includes(photo.id));

      return {
        photos,
        recycleBin: [...deletedPhotos, ...state.recycleBin],
        ...deriveState(photos),
      };
    }),

  restorePhoto: (id) =>
    set((state) => {
      const target = state.recycleBin.find((photo) => photo.id === id);
      if (!target) return state;

      const photos = [target, ...state.photos];
      return {
        photos,
        recycleBin: state.recycleBin.filter((photo) => photo.id !== id),
        ...deriveState(photos),
      };
    }),

  selectCluster: (cluster) => set({ selectedCluster: cluster }),
}));
