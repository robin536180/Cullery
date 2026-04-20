import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Mic, MicOff, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { NativeService } from '../services/native';

export const Voice = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { t } = useTranslation();

  const toggleListening = async () => {
    if (!isListening) {
      const granted = await NativeService.requestPermissions();
      if (!granted) return;
    }

    setIsListening(!isListening);
    if (!isListening) {
      setTranscript('');
      // Simulate recognition
      setTimeout(() => {
        setTranscript(t('voice.example1'));
        setTimeout(() => setIsListening(false), 2000);
      }, 3000);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col items-center justify-center space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t('voice.title')}</h1>
        <p className="text-xl text-muted-foreground max-w-lg mx-auto">
          {t('voice.tapToSpeak')}
        </p>
      </div>

      <div className="relative">
        {/* Ripple Effects */}
        <AnimatePresence>
          {isListening && (
            <>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 2.5 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeOut"
                  }}
                  className="absolute inset-0 bg-primary/20 rounded-full"
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Mic Button */}
        <button
          onClick={toggleListening}
          className="relative z-10 w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
        >
          {isListening ? (
            <Mic className="w-12 h-12 text-primary-foreground" />
          ) : (
            <MicOff className="w-12 h-12 text-primary-foreground opacity-50" />
          )}
        </button>
      </div>

      <div className="h-24 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isListening ? (
             <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl font-light text-primary animate-pulse"
             >
               {t('voice.listening')}
             </motion.div>
          ) : transcript ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-medium text-white flex items-center gap-3"
            >
              <Command className="w-6 h-6 text-primary" />
              "{transcript}"
            </motion.div>
          ) : (
            <div className="text-muted-foreground text-center space-y-2">
              <p>{t('voice.examples')}</p>
              <div className="flex gap-4">
                <span className="bg-white/5 px-3 py-1 rounded-full text-sm">{t('voice.example1')}</span>
                <span className="bg-white/5 px-3 py-1 rounded-full text-sm">{t('voice.example2')}</span>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
