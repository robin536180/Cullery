import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Trash2, Check, X, AlertTriangle, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const Cleanup = () => {
  const { cleanupSuggestions, deletePhoto, deletePhotos } = useStore();
  const [activeTab, setActiveTab] = useState<'duplicates' | 'screenshots' | 'lowQuality'>('duplicates');
  const { t } = useTranslation();

  if (!cleanupSuggestions) return <div className="p-6">{t('common.loading')}</div>;

  const tabs = [
    { id: 'duplicates', label: t('dashboard.duplicates'), count: cleanupSuggestions.duplicates.length },
    { id: 'screenshots', label: t('dashboard.screenshots'), count: cleanupSuggestions.screenshots.length },
    { id: 'lowQuality', label: t('dashboard.lowQuality'), count: cleanupSuggestions.lowQuality.length },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t('cleanup.title')}</h1>
          <p className="text-muted-foreground">{t('cleanup.scanning')}</p>
        </div>
        
        <div className="flex bg-card border border-white/5 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all relative",
                activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-md"
                />
              )}
              {tab.label} <span className="ml-1 opacity-60 text-xs">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'duplicates' && (
            <div className="space-y-6">
              {cleanupSuggestions.duplicates.map((cluster) => (
                <Card key={cluster.id} className="overflow-hidden">
                  <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('cleanup.similarGroups')}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {cluster.photos.length} photos
                      </span>
                    </div>
                    <button 
                      onClick={() => deletePhotos(cluster.recommendedDeletions)}
                      className="text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> {t('common.delete')} {cluster.recommendedDeletions.length} Rejects
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {cluster.photos.map((photo) => {
                        const isBest = photo.id === cluster.bestPhotoId;
                        const isRejected = cluster.recommendedDeletions.includes(photo.id);

                        return (
                          <div key={photo.id} className="relative group aspect-[4/3]">
                            <img
                              src={photo.thumbnailUrl}
                              alt={photo.fileName}
                              className={cn(
                                "w-full h-full object-cover rounded-lg border-2 transition-all",
                                isBest ? "border-primary ring-2 ring-primary/20" : 
                                isRejected ? "border-red-500/50 opacity-60 grayscale-[0.5]" : "border-transparent"
                              )}
                            />
                            
                            {isBest && (
                              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-bold shadow-sm">
                                {t('cleanup.bestShot')}
                              </div>
                            )}

                            {isRejected && (
                              <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-sm">
                                <Trash2 className="w-3 h-3" />
                              </div>
                            )}
                            
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                              <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-sm text-white">
                                <Maximize2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {cleanupSuggestions.duplicates.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  <Check className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  {t('dashboard.scanComplete')}
                </div>
              )}
            </div>
          )}


          {activeTab === 'screenshots' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cleanupSuggestions.screenshots.map((photo) => (
                <div key={photo.id} className="relative group aspect-[9/16] bg-black/20 rounded-lg overflow-hidden">
                   <img
                      src={photo.thumbnailUrl}
                      alt={photo.fileName}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-2 right-2">
                       <input type="checkbox" className="w-5 h-5 rounded border-white/20 bg-black/40 checked:bg-primary" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-xs text-white">
                      {photo.fileName}
                    </div>
                </div>
              ))}
               {cleanupSuggestions.screenshots.length === 0 && (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                  <Check className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No screenshots found.
                </div>
              )}
            </div>
          )}
          
           {activeTab === 'lowQuality' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cleanupSuggestions.lowQuality.map((photo) => (
                <div key={photo.id} className="relative group aspect-[4/3] bg-black/20 rounded-lg overflow-hidden">
                   <img
                      src={photo.thumbnailUrl}
                      alt={photo.fileName}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity grayscale-[0.3]"
                    />
                    <div className="absolute top-2 right-2">
                       <div className="bg-red-500/80 text-white text-[10px] px-2 py-0.5 rounded-full">
                         Score: {photo.aiAnalysis?.qualityScore}
                       </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg">
                           <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
              ))}
               {cleanupSuggestions.lowQuality.length === 0 && (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                   <Check className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No low quality photos found.
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
