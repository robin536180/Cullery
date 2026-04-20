# Cullery Phase 1 执行指南

## 1. 目标

本指南用于指导团队完成 Phase 1：Android 端真实安装、权限打通、相册读取与基础清理链路验证。

## 2. Phase 1 完成标准

满足以下条件即视为 Phase 1 完成：

- Android 工程可在本地 Android Studio 打开
- App 可在 Android 虚拟机启动
- 相册权限与麦克风权限可正确申请
- `NativeService.getPhotos()` 能返回真实照片
- 首页和清理页不再依赖纯 mock 数据
- 至少完成一次真实清理与恢复操作

## 3. 执行前准备

### 3.1 本地环境

- 安装 Android Studio
- 安装 Android SDK
- 安装 JDK（按 Android Studio 推荐版本）
- 安装 Node.js 与 npm

### 3.2 项目准备

在项目根目录执行：

```bash
npm install
npm run build
npx cap sync
```

### 3.3 打开 Android 工程

使用 Android Studio 打开：

```text
c:\Users\Administrator\Desktop\Cullery\android
```

## 4. 推荐执行顺序

### Step 1：验证工程可运行

目标：

- App 在 Android Studio 中无阻断报错
- 可安装到虚拟机

操作：

- 等待 Gradle 同步完成
- 创建或启动一台 Android 虚拟机
- 点击 Run 启动应用

验收：

- 应用能打开
- 进入默认首页

### Step 2：打通权限

目标：

- 相册权限申请成功
- 麦克风权限申请成功

操作：

- 检查 `AndroidManifest.xml`
- 确保读取媒体与录音权限已声明
- 在设置页与语音页触发权限申请

验收：

- 弹出系统权限框
- 授权后状态变为 granted
- 拒绝后状态变为 denied，并有提示

### Step 3：打通真实相册读取

目标：

- `NativeService.getPhotos()` 返回真实数据

操作建议：

- 增加 Android 媒体库读取实现
- 读取最近照片列表
- 返回最小可用字段：
  - `id`
  - `fileName`
  - `filePath`
  - `fileSize`
  - `width`
  - `height`
  - `creationDate`
  - `mimeType`

验收：

- Dashboard 展示真实照片数量
- Cleanup 页面展示真实图片缩略图或占位数据

### Step 4：接入 Store

目标：

- 页面不再依赖纯 mock 数据

操作：

- 修改 `useStore` 中的加载逻辑
- 在 `loadPhotos()` 中优先调用 `NativeService.getPhotos()`
- 保留 Web 模式 mock 兜底

验收：

- Android 模式展示真实数据
- Web 模式仍可演示

### Step 5：实现基础清理闭环

目标：

- 完成截图清理与回收站流程

操作建议：

- 先做截图识别
- 再做完全重复项检测
- 最后接入应用内回收站

验收：

- 可列出截图候选
- 可触发删除动作
- 删除后进入回收站
- 可恢复

## 5. Phase 1 重点代码区域

建议优先关注以下文件：

- `src/services/native.ts`
- `src/store/useStore.ts`
- `src/pages/Settings.tsx`
- `src/pages/Cleanup.tsx`
- `src/pages/Dashboard.tsx`
- `android/app/src/main/AndroidManifest.xml`

## 6. 关键实现建议

### 6.1 权限策略

- 权限要按需申请，不要应用一打开全部强拉
- 设置页必须可见当前权限状态
- 被拒绝后要有跳转系统设置的指引文案

### 6.2 数据策略

- Android 真数据优先
- Web 保留 mock 数据用于演示
- 图片预览优先使用缩略图，避免直接加载原图

### 6.3 清理策略

- 真正删除前统一先进入应用内回收站
- 第一阶段不追求“自动永久删除”
- 所有删除动作都应可恢复

## 7. 风险点

- Android 媒体库访问在不同系统版本上存在差异
- 直接读取全量相册可能导致首屏卡顿
- 缩略图生成不当会导致内存压力
- 删除能力若直接做系统级删除，风险较高

## 8. 风险应对

- 先读取最近照片或分页读取
- 先做截图与重复项，不急于做全量复杂聚类
- 回收站先在应用层实现
- 真机验证与虚拟机验证都要保留

## 9. Phase 1 交付物

- 可运行 Android 调试版
- 权限打通版本
- 真实相册读取版本
- 截图清理与回收站版本
- 一轮虚拟机测试记录

## 10. 交付后下一步

Phase 1 完成后，立即进入：

- Phase 2：重复项与相似候选增强
- Phase 3：最佳照片推荐
- Phase 4：语音控制闭环
- Phase 5：模型下载与轻量 AI 接入
