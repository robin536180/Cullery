# Cullery 接口与数据结构设计文档

## 1. 文档目标

本文件定义 Cullery MVP 阶段的核心数据结构、前端 Store 结构、原生桥接接口和后续可扩展接口约定。

## 2. 设计原则

- 优先满足本地运行与离线处理
- 优先满足 Android MVP
- 接口以“可扩展到 iOS / Desktop”为原则
- 兼容当前 Web Demo 与后续真实原生能力接入

## 3. 核心实体

### 3.1 Photo

```ts
interface Photo {
  id: string;
  fileName: string;
  filePath: string;
  thumbnailUrl?: string;
  mimeType?: string;
  fileSize: number;
  width: number;
  height: number;
  creationDate: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  hash?: string;
  isScreenshot?: boolean;
  isDuplicate?: boolean;
  clusterId?: string;
  aiAnalysis?: PhotoAnalysis;
}
```

### 3.2 PhotoAnalysis

```ts
interface PhotoAnalysis {
  qualityScore: number;
  blurScore: number;
  exposureScore: number;
  compositionScore: number;
  emotionScore: number;
  colorScore?: number;
  sharpnessScore?: number;
  sceneCategory?: string;
  recommendation?: 'keep' | 'delete' | 'review';
  reasoning?: string[];
}
```

### 3.3 SimilarityCluster

```ts
interface SimilarityCluster {
  id: string;
  clusterType: 'duplicate' | 'similar' | 'burst';
  photos: Photo[];
  bestPhotoId?: string;
  recommendedDeletions: string[];
}
```

### 3.4 CleanupSuggestion

```ts
interface CleanupSuggestion {
  duplicates: SimilarityCluster[];
  screenshots: Photo[];
  lowQuality: Photo[];
  totalSpaceReclaimable: number;
  confidence?: number;
}
```

### 3.5 ModelStatus

```ts
interface ModelStatus {
  modelId: string;
  modelName: string;
  version: string;
  sizeInMB: number;
  status: 'not_downloaded' | 'downloading' | 'ready' | 'failed';
  progress: number;
  localPath?: string;
  checksum?: string;
  lastUpdatedAt?: string;
}
```

### 3.6 PermissionState

```ts
interface PermissionState {
  photos: 'prompt' | 'granted' | 'denied' | 'limited';
  microphone: 'prompt' | 'granted' | 'denied';
}
```

## 4. Store 设计建议

```ts
interface AppState {
  language: 'zh' | 'en';
  permissions: PermissionState;
  photos: Photo[];
  cleanupSuggestions: CleanupSuggestion | null;
  selectedCluster: SimilarityCluster | null;
  recycleBin: Photo[];
  modelStatus: ModelStatus | null;

  loadPhotos: () => Promise<void>;
  analyzeStorage: () => Promise<void>;
  analyzeCleanup: () => Promise<void>;
  moveToRecycleBin: (photoIds: string[]) => void;
  restoreFromRecycleBin: (photoIds: string[]) => void;
  setLanguage: (lang: 'zh' | 'en') => void;
}
```

## 5. 原生桥接接口设计

当前推荐以 `NativeService` 作为统一入口。

### 5.1 权限接口

```ts
checkPermissions(): Promise<PermissionState>
requestPermissions(): Promise<boolean>
```

### 5.2 相册读取接口

```ts
getPhotos(params?: {
  limit?: number;
  offset?: number;
  onlyScreenshots?: boolean;
  fromDate?: string;
  toDate?: string;
}): Promise<Photo[]>
```

### 5.3 删除与回收站接口

```ts
deletePhotos(photoIds: string[]): Promise<boolean>
restorePhotos(photoIds: string[]): Promise<boolean>
```

### 5.4 语音接口

```ts
startSpeechRecognition(): Promise<void>
stopSpeechRecognition(): Promise<void>
getSpeechResult(): Promise<string>
```

### 5.5 模型下载接口

```ts
downloadModel(
  modelId: string,
  onProgress: (progress: number) => void
): Promise<ModelStatus>

getModelStatus(modelId: string): Promise<ModelStatus>
```

## 6. 页面数据依赖

### 6.1 Dashboard

依赖：

- `photos`
- `cleanupSuggestions`
- `storageStats`

输出：

- 空间统计
- 清理建议
- 回收空间估算

### 6.2 Cleanup

依赖：

- `cleanupSuggestions.duplicates`
- `cleanupSuggestions.screenshots`
- `cleanupSuggestions.lowQuality`

输出：

- 可删除候选列表
- 推荐删除动作

### 6.3 Selection

依赖：

- `selectedCluster`
- `Photo.aiAnalysis`

输出：

- 最佳照片推荐
- 候选评分
- 推荐理由

### 6.4 Voice

依赖：

- `permissions.microphone`
- 语音识别结果
- 命令解析结果

### 6.5 Settings

依赖：

- `permissions`
- `modelStatus`
- `language`

## 7. 命令解析数据结构

```ts
interface VoiceCommandResult {
  rawText: string;
  intent:
    | 'delete_screenshots'
    | 'keep_best_photo'
    | 'open_settings'
    | 'scan_recent_photos'
    | 'unknown';
  entities?: Record<string, string | number | boolean>;
  confidence?: number;
}
```

## 8. 清理流程状态机建议

```ts
type CleanupFlowStatus =
  | 'idle'
  | 'scanning'
  | 'grouped'
  | 'reviewing'
  | 'confirmed'
  | 'moved_to_recycle_bin'
  | 'restored'
  | 'failed';
```

## 9. 后续扩展字段预留

为 Full Spec 预留以下字段：

- `peopleTags`
- `eventId`
- `storyScore`
- `aestheticScore`
- `weatherTag`
- `timeOfDayTag`
- `landmarkTag`
- `userPreferenceWeight`

## 10. 接口实现阶段建议

### MVP 阶段

- 先保证本地接口与 Store 的结构稳定
- Web 继续允许部分 mock 数据存在
- Android 先打通真实 `getPhotos()` 与权限接口

### Full 阶段

- 接入模型分析任务队列
- 接入复杂语义命令解析
- 接入场景化评分与个性化学习

## 11. 验收要求

- 接口字段命名一致
- 前端页面和 Store 字段保持同步
- NativeService 能实际返回权限与照片数据
- 数据结构足以支撑截图清理、重复检测、最佳照片推荐三条核心链路
