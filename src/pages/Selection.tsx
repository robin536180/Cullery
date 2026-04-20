import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Check, X, AlertCircle, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const Selection = () => {
  const { photos } = useStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { t } = useTranslation();

  // Filter photos that have AI analysis (simulating selected cluster)
  const candidates = photos.slice(0, 5); 
  const selectedPhoto = candidates[selectedIndex];

  if (!selectedPhoto) return <div className="p-6">{t('common.loading')}</div>;

  const analysis = selectedPhoto.aiAnalysis || {
    qualityScore: 0,
    blurScore: 0,
    exposureScore: 0,
    compositionScore: 0,
    emotionScore: 0,
    sceneCategory: 'Unknown',
    faces: []
  };

  const radarData = [
    { subject: t('selection.sharpness'), A: analysis.qualityScore, fullMark: 100 },
    { subject: t('selection.exposure'), A: analysis.exposureScore, fullMark: 100 },
    { subject: t('selection.composition'), A: analysis.compositionScore, fullMark: 100 },
    { subject: t('selection.moment'), A: analysis.emotionScore, fullMark: 100 },
    { subject: t('selection.color'), A: (analysis.qualityScore + analysis.exposureScore) / 2, fullMark: 100 }, // Mock color score
  ];

  const getRecommendation = (score: number) => {
    if (score > 80) return { label: 'Strong Keep', color: 'text-primary', icon: Sparkles };
    if (score > 60) return { label: 'Keep', color: 'text-blue-500', icon: Check };
    if (score > 40) return { label: 'Review', color: 'text-yellow-500', icon: AlertCircle };
    return { label: 'Delete', color: 'text-red-500', icon: X };
  };

  const recommendation = getRecommendation(analysis.qualityScore);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t('selection.title')}</h1>
          <p className="text-muted-foreground">{t('selection.aiRating')}</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Main Photo Preview */}
        <div className="lg:col-span-2 bg-black/40 rounded-xl overflow-hidden relative flex flex-col">
          <div className="flex-1 relative flex items-center justify-center p-4">
             <motion.img
              key={selectedPhoto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              src={selectedPhoto.thumbnailUrl}
              alt={selectedPhoto.fileName}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
            />
            
            {/* Navigation Buttons */}
            <button 
              onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
              disabled={selectedIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white disabled:opacity-30 backdrop-blur-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setSelectedIndex(Math.min(candidates.length - 1, selectedIndex + 1))}
              disabled={selectedIndex === candidates.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white disabled:opacity-30 backdrop-blur-sm"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Filmstrip */}
          <div className="h-24 bg-black/60 backdrop-blur-md border-t border-white/10 p-4 flex gap-4 overflow-x-auto">
            {candidates.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  "relative aspect-video h-full rounded-md overflow-hidden border-2 transition-all shrink-0",
                  idx === selectedIndex ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img src={photo.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                {photo.aiAnalysis && photo.aiAnalysis.qualityScore > 80 && (
                   <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="space-y-6 overflow-y-auto pr-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('selection.aiRating')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#404040" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke="#00d4aa"
                      fill="#00d4aa"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                  <div className="text-3xl font-bold text-primary">{analysis.qualityScore}</div>
                </div>
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5", recommendation.color)}>
                  <recommendation.icon className="w-5 h-5" />
                  <span className="font-medium">{recommendation.label}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('selection.reasoning')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">Sharp Focus:</span> Subject eyes are perfectly in focus with good depth of field.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">Golden Hour:</span> Excellent lighting conditions with warm tones.
                  </p>
                </div>
                {analysis.compositionScore < 60 && (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">Composition:</span> Horizon line is slightly tilted. Consider cropping.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 gap-4">
             <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> {t('common.keep')}
             </button>
             <button className="w-full bg-red-500/10 text-red-500 py-3 rounded-lg font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                <X className="w-5 h-5" /> {t('common.delete')}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
