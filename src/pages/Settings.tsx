import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Shield, Smartphone, Moon, Globe, Download, Check, Mic, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NativeService } from '../services/native';
import type { NativePermissionStatus } from '../services/native';

export const Settings = () => {
  const { t, i18n } = useTranslation();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [permissions, setPermissions] = useState<NativePermissionStatus>({
    camera: 'prompt',
    photos: 'prompt',
    microphone: 'prompt',
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const perms = await NativeService.checkPermissions();
    setPermissions(perms);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await NativeService.downloadModel((progress) => {
      setDownloadProgress(progress);
    });
    setIsDownloading(false);
    setIsDownloaded(true);
  };

  const requestPerms = async () => {
    await NativeService.requestPermissions();
    checkStatus();
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight mb-2">{t('settings.title')}</h1>
      
      <div className="space-y-6">
        {/* AI Model Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              {t('settings.modelManagement')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <div className="font-medium">DeepSeek Janus-Pro-7B (Quantized)</div>
                <div className="text-sm text-muted-foreground">{t('settings.modelSize')}</div>
              </div>
              <div className="text-right">
                {!isDownloaded && !isDownloading && (
                  <button 
                    onClick={handleDownload}
                    className="px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {t('settings.download')}
                  </button>
                )}
                {isDownloading && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm text-primary">{t('settings.downloading')} {downloadProgress}%</span>
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                    </div>
                  </div>
                )}
                {isDownloaded && (
                  <div className="flex items-center gap-2 text-green-500">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('settings.modelDownloaded')}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              {t('settings.permissions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>{t('settings.photoLibrary')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground capitalize">{permissions.photos || 'prompt'}</span>
                {permissions.photos !== 'granted' && (
                  <button onClick={requestPerms} className="text-xs bg-secondary px-2 py-1 rounded hover:bg-secondary/80">
                    {t('settings.check')}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                <span>{t('settings.microphone')}</span>
              </div>
               <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground capitalize">{permissions.microphone || 'prompt'}</span>
                 {permissions.microphone !== 'granted' && (
                  <button onClick={requestPerms} className="text-xs bg-secondary px-2 py-1 rounded hover:bg-secondary/80">
                    {t('settings.check')}
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-500" />
              App Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </div>
               <div className="text-sm text-muted-foreground">Always On</div>
            </div>
             <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>{t('settings.language')}</span>
              </div>
               <div className="flex items-center gap-2">
                 <span className="text-sm text-muted-foreground">
                   {i18n.language === 'en' ? 'English' : '中文'}
                 </span>
                 <button 
                   onClick={toggleLanguage}
                   className="text-xs bg-secondary px-3 py-1 rounded hover:bg-secondary/80 transition-colors"
                 >
                   Switch
                 </button>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center text-sm text-muted-foreground pt-8">
        Cullery v0.1.0 (MVP Demo) {NativeService.isNative ? '- Native Mode' : '- Web Mode'}
      </div>
    </div>
  );
};
