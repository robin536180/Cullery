import { create } from 'zustand';
import { PhotoMetadata, AICleanupSuggestion, SimilarityCluster, ProfessionalSelection } from '../types';

interface AppState {
  photos: PhotoMetadata[];
  cleanupSuggestions: AICleanupSuggestion | null;
  selectedCluster: SimilarityCluster | null;
  professionalSelections: Record<string, ProfessionalSelection>; // photoId -> selection
  storageStats: {
    totalPhotos: number;
    usedSpace: number; // in GB
    screenshotsSize: number;
    duplicatesSize: number;
    videosSize: number;
  };
  isLoading: boolean;
  
  // Actions
  initializeMockData: () => void;
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

export const useStore = create<AppState>((set, get) => ({
  photos: [],
  cleanupSuggestions: null,
  selectedCluster: null,
  professionalSelections: {},
  storageStats: {
    totalPhotos: 0,
    usedSpace: 0,
    screenshotsSize: 0,
    duplicatesSize: 0,
    videosSize: 0,
  },
  isLoading: false,

  initializeMockData: () => {
    set({ isLoading: true });
    
    // Simulate async loading
    setTimeout(() => {
      const photos = generateMockPhotos(50);
      
      // Create mock clusters
      const duplicates: SimilarityCluster[] = [];
      for (let i = 0; i < 5; i++) {
        const clusterPhotos = photos.slice(i * 3, i * 3 + 3);
        duplicates.push({
          id: `cluster-${i}`,
          photos: clusterPhotos,
          clusterType: 'similar',
          bestPhotoId: clusterPhotos[0].id,
          recommendedDeletions: clusterPhotos.slice(1).map(p => p.id)
        });
      }
      
      const screenshots = photos.filter(p => p.type === 'screenshot');
      const lowQuality = photos.filter(p => (p.aiAnalysis?.qualityScore || 100) < 40);
      
      const totalSize = photos.reduce((acc, p) => acc + p.fileSize, 0);
      const screenshotsSize = screenshots.reduce((acc, p) => acc + p.fileSize, 0);
      
      set({
        photos,
        storageStats: {
          totalPhotos: photos.length,
          usedSpace: totalSize / (1024 * 1024 * 1024),
          screenshotsSize: screenshotsSize / (1024 * 1024 * 1024),
          duplicatesSize: 0.5, // Mock
          videosSize: 1.2, // Mock
        },
        cleanupSuggestions: {
          duplicates,
          screenshots,
          lowQuality,
          totalSpaceReclaimable: (screenshotsSize + 0.5 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024),
          confidence: 0.95
        },
        isLoading: false
      });
    }, 1000);
  },

  deletePhoto: (id) => set((state) => ({
    photos: state.photos.filter(p => p.id !== id)
  })),

  deletePhotos: (ids) => set((state) => ({
    photos: state.photos.filter(p => !ids.includes(p.id))
  })),

  restorePhoto: (id) => console.log('Restore photo', id), // Mock implementation

  selectCluster: (cluster) => set({ selectedCluster: cluster }),
}));
