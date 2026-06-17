import { Capacitor, registerPlugin } from '@capacitor/core';
import { Camera, type CameraPermissionState, type GalleryPhoto } from '@capacitor/camera';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

import type { PhotoMetadata } from '../types';

export interface ModelDownloadStatus {
  progress: number;
  isDownloaded: boolean;
  isDownloading: boolean;
}

export interface NativePermissionStatus {
  camera: CameraPermissionState;
  photos: CameraPermissionState;
  microphone: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';
}

interface NativeScannedPhoto {
  id: string;
  contentUri: string;
  displayName: string;
  size: number;
  width: number;
  height: number;
  dateTaken: number;
  relativePath: string;
  bucket: string;
  mimeType: string;
  isScreenshot: boolean;
  thumbnailPath: string;
}

interface PhotoLibraryPlugin {
  scanPhotos(options: { limit?: number }): Promise<{ permission: 'granted' | 'denied'; photos: NativeScannedPhoto[] }>;
}

const PhotoLibrary = registerPlugin<PhotoLibraryPlugin>('PhotoLibrary');

const createSeed = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 9973;
  }
  return hash;
};

const readImageDimensions = (src: string) =>
  new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth || 1080,
        height: image.naturalHeight || 1920,
      });
    };
    image.onerror = () => {
      resolve({ width: 1080, height: 1920 });
    };
    image.src = src;
  });

const readFileSize = async (src?: string) => {
  if (!src) return 2 * 1024 * 1024;

  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return blob.size || 2 * 1024 * 1024;
  } catch {
    return 2 * 1024 * 1024;
  }
};

const inferType = (fileName: string, width: number, height: number): PhotoMetadata['type'] => {
  const lowerName = fileName.toLowerCase();
  const aspectRatio = height > 0 ? Math.max(width, height) / Math.min(width, height) : 1;

  if (lowerName.includes('screenshot') || lowerName.includes('screen') || aspectRatio > 1.9) {
    return 'screenshot';
  }

  if (lowerName.includes('doc') || lowerName.includes('scan')) {
    return 'document';
  }

  return 'photo';
};

const buildAiAnalysis = (seed: number, type: PhotoMetadata['type']) => {
  const qualityScore = 35 + (seed % 55);
  const blurScore = 20 + ((seed * 3) % 70);
  const exposureScore = 30 + ((seed * 5) % 60);
  const compositionScore = 25 + ((seed * 7) % 65);
  const emotionScore = 20 + ((seed * 11) % 70);

  return {
    qualityScore: type === 'screenshot' ? Math.min(qualityScore, 55) : qualityScore,
    blurScore,
    exposureScore,
    compositionScore,
    emotionScore,
    sceneCategory: type === 'screenshot' ? 'Screenshot' : 'Library Import',
    faces: [],
  };
};

const createPhotoMetadata = async (photo: GalleryPhoto, index: number): Promise<PhotoMetadata> => {
  const filePath = photo.path || photo.webPath;
  const fileName = filePath.split('/').pop() || `imported-photo-${index}.jpg`;
  const { width, height } = await readImageDimensions(photo.webPath);
  const fileSize = await readFileSize(photo.webPath);
  const seed = createSeed(filePath);
  const type = inferType(fileName, width, height);

  return {
    id: `library-${seed}-${index}`,
    filePath,
    fileName,
    fileSize,
    width,
    height,
    creationDate: new Date().toISOString(),
    hash: `hash-${seed}`,
    type,
    thumbnailUrl: photo.webPath,
    aiAnalysis: buildAiAnalysis(seed, type),
  };
};

const mapScannedPhotoToMetadata = (photo: NativeScannedPhoto, index: number): PhotoMetadata => {
  const seed = createSeed(photo.contentUri || `${photo.id}-${index}`);
  const type: PhotoMetadata['type'] = photo.isScreenshot ? 'screenshot' : 'photo';
  const thumbnailUrl = photo.thumbnailPath ? Capacitor.convertFileSrc(photo.thumbnailPath) : photo.contentUri;

  return {
    id: `ms-${photo.id}`,
    filePath: photo.contentUri,
    fileName: photo.displayName || `media-${photo.id}.jpg`,
    fileSize: photo.size || 2 * 1024 * 1024,
    width: photo.width || 1080,
    height: photo.height || 1920,
    creationDate: new Date(photo.dateTaken || Date.now()).toISOString(),
    hash: `hash-ms-${seed}`,
    type,
    thumbnailUrl,
    aiAnalysis: buildAiAnalysis(seed, type),
  };
};

const pickPhotosFromWeb = async (): Promise<PhotoMetadata[]> =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = async () => {
      const files = Array.from(input.files || []);

      if (files.length === 0) {
        resolve([]);
        return;
      }

      const photos = await Promise.all(
        files.map(async (file, index) => {
          const objectUrl = URL.createObjectURL(file);
          const { width, height } = await readImageDimensions(objectUrl);
          const seed = createSeed(`${file.name}-${file.size}-${index}`);
          const type = inferType(file.name, width, height);

          return {
            id: `web-${seed}-${index}`,
            filePath: objectUrl,
            fileName: file.name,
            fileSize: file.size,
            width,
            height,
            creationDate: new Date(file.lastModified || Date.now()).toISOString(),
            hash: `hash-${seed}`,
            type,
            thumbnailUrl: objectUrl,
            aiAnalysis: buildAiAnalysis(seed, type),
          } satisfies PhotoMetadata;
        })
      );

      resolve(photos);
    };

    input.click();
  });

export const NativeService = {
  isNative: Capacitor.isNativePlatform(),

  async checkPermissions(): Promise<NativePermissionStatus> {
    if (!this.isNative) {
      return {
        camera: 'granted',
        microphone: 'granted',
        photos: 'granted',
      };
    }

    try {
      const camera = await Camera.checkPermissions();
      const speech = await SpeechRecognition.checkPermissions();

      return {
        camera: camera.camera,
        photos: camera.photos,
        microphone: speech.speechRecognition,
      };
    } catch (e) {
      console.error('Permission check failed', e);
      return { camera: 'denied', photos: 'denied', microphone: 'denied' };
    }
  },

  async requestPermissions() {
    if (!this.isNative) return true;

    try {
      const camera = await Camera.requestPermissions({ permissions: ['photos'] });
      const speech = await SpeechRecognition.requestPermissions();

      return (
        (camera.photos === 'granted' || camera.photos === 'limited') &&
        speech.speechRecognition === 'granted'
      );
    } catch (e) {
      console.error('Permission request failed', e);
      return false;
    }
  },

  async downloadModel(onProgress: (progress: number) => void): Promise<void> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        onProgress(progress);

        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  },

  async getPhotos(): Promise<PhotoMetadata[]> {
    if (!this.isNative) {
      return pickPhotosFromWeb();
    }

    try {
      const result = await PhotoLibrary.scanPhotos({ limit: 500 });
      if (result.permission !== 'granted') {
        return [];
      }
      return result.photos.map((photo, index) => mapScannedPhotoToMetadata(photo, index));
    } catch (error) {
      console.error('Failed to scan MediaStore photos, falling back to picker', error);
      const picked = await Camera.pickImages({
        limit: 50,
        quality: 80,
      });

      return Promise.all(picked.photos.map((photo, index) => createPhotoMetadata(photo, index)));
    }
  },
};
