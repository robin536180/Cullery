import React from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowRight, Image as ImageIcon, Video, Copy, FileText, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Dashboard = () => {
  const { storageStats, cleanupSuggestions, photos, isLoading, loadPhotosFromLibrary } = useStore();
  const { t } = useTranslation();

  const pieData = [
    { name: t('dashboard.totalPhotos'), value: storageStats.usedSpace - storageStats.videosSize - storageStats.duplicatesSize, color: '#00d4aa' },
    { name: t('dashboard.totalVideos'), value: storageStats.videosSize, color: '#3b82f6' },
    { name: t('dashboard.duplicates'), value: storageStats.duplicatesSize, color: '#ef4444' },
    { name: t('dashboard.screenshots'), value: storageStats.screenshotsSize, color: '#f59e0b' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t('nav.spaceAnalysis')}</h1>
          <p className="text-muted-foreground">{t('dashboard.storageOverview')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadPhotosFromLibrary()}
            className="px-4 py-2 rounded-lg font-medium border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isLoading ? t('common.loading') : t('dashboard.importPhotos')}
          </button>
          <Link to="/cleanup" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
            {t('nav.smartCleanup')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {!isLoading && photos.length === 0 && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-semibold">{t('dashboard.noPhotosTitle')}</div>
              <p className="text-sm text-muted-foreground mt-1">{t('dashboard.noPhotosDesc')}</p>
            </div>
            <button
              onClick={() => void loadPhotosFromLibrary()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {t('dashboard.importPhotos')}
            </button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.totalPhotos')}</p>
                <div className="text-2xl font-bold">{storageStats.totalPhotos}</div>
              </div>
              <div className="bg-primary/10 p-2 rounded-full text-primary">
                <ImageIcon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.storageOverview')}</p>
                <div className="text-2xl font-bold">{storageStats.usedSpace.toFixed(1)} GB</div>
              </div>
              <div className="bg-blue-500/10 p-2 rounded-full text-blue-500">
                <Video className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.spaceSaved')}</p>
                <div className="text-2xl font-bold text-primary">
                  {cleanupSuggestions?.totalSpaceReclaimable.toFixed(1) || 0} GB
                </div>
              </div>
              <div className="bg-green-500/10 p-2 rounded-full text-green-500">
                <Copy className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.screenshots')}</p>
                <div className="text-2xl font-bold">{cleanupSuggestions?.screenshots.length || 0}</div>
              </div>
              <div className="bg-orange-500/10 p-2 rounded-full text-orange-500">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle>{t('dashboard.storageOverview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#252525', borderColor: '#404040', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.cleanupSuggestions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium group-hover:text-primary transition-colors">{t('dashboard.duplicates')}</div>
                  <div className="text-sm text-muted-foreground">{cleanupSuggestions?.duplicates.length || 0} sets found</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium group-hover:text-primary transition-colors">{t('dashboard.screenshots')}</div>
                  <div className="text-sm text-muted-foreground">{cleanupSuggestions?.screenshots.length || 0} images found</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium group-hover:text-primary transition-colors">{t('dashboard.lowQuality')}</div>
                  <div className="text-sm text-muted-foreground">{cleanupSuggestions?.lowQuality.length || 0} images found</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
