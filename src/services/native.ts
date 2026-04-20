import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

export interface ModelDownloadStatus {
  progress: number;
  isDownloaded: boolean;
  isDownloading: boolean;
}

export const NativeService = {
  isNative: Capacitor.isNativePlatform(),

  async checkPermissions() {
    if (!this.isNative) {
      return {
        camera: 'granted',
        microphone: 'granted',
        photos: 'granted'
      };
    }

    try {
      const camera = await Camera.checkPermissions();
      // const mic = await SpeechRecognition.checkPermissions(); // Speech plugin API might vary
      
      return {
        camera: camera.camera,
        photos: camera.photos,
        microphone: 'prompt' // Simplified for demo
      };
    } catch (e) {
      console.error('Permission check failed', e);
      return { camera: 'denied', photos: 'denied', microphone: 'denied' };
    }
  },

  async requestPermissions() {
    if (!this.isNative) return true;
    
    try {
      await Camera.requestPermissions();
      await SpeechRecognition.requestPermissions();
      return true;
    } catch (e) {
      console.error('Permission request failed', e);
      return false;
    }
  },

  async downloadModel(onProgress: (progress: number) => void): Promise<void> {
    // Simulate download for both Web and Native for MVP demo
    // In real native app, this would use Filesystem.downloadFile
    
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        onProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 200); // 4 seconds to download
    });
  },

  async getPhotos() {
    if (!this.isNative) {
      return []; // Web mock data is handled in store
    }
    // Native implementation would use @capacitor-community/photolibrary or similar
    // For MVP demo we just return empty or invoke camera picker
    return [];
  }
};
