import { useRef, useState, useEffect } from 'react';
import { Send, Mic, Camera, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/app/contexts/LanguageContext';
import Image from 'next/image';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  isListening: boolean;
  files: FileList | undefined;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onVoiceToggle: () => void;
  onImageUpload: () => void;
  onFilesChange: (files: FileList | undefined) => void;
  isRecording: boolean;
}

export const ChatInput = ({
  input,
  isLoading,
  isListening,
  files,
  onInputChange,
  onSubmit,
  onVoiceToggle,
  onImageUpload,
  onFilesChange,
  isRecording
}: ChatInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showVoiceInfo, setShowVoiceInfo] = useState(false);
  const { t } = useLanguage();
  
  // Check if we're on HTTPS or localhost
  const isSecureContext = typeof window !== 'undefined' && 
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
  
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesChange(event.target.files);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4">
      <form onSubmit={onSubmit} className="flex gap-3 items-end">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*,application/pdf"
          className="hidden"
        />

        {/* Input field */}
        <div className="flex-1 relative">
          <input
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
              isListening 
                ? 'border-blue-300 bg-blue-50/50' 
                : 'border-gray-300'
            }`}
            value={input}
            placeholder={isListening ? t('chat.listening') : t('chat.placeholder')}
            onChange={onInputChange}
            disabled={isLoading}
          />
          {isListening && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="flex space-x-1">
                <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          )}
          
          {/* File preview */}
          {files && files.length > 0 && (
            <div className="absolute bottom-full mb-2 flex gap-2">
              {Array.from(files).map((file, index) => (
                <div key={index} className="bg-orange-50 text-orange-600 text-xs px-2 py-1 rounded">
                  📎 {file.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleImageClick}
            className="shrink-0"
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={isMobile && !isSecureContext ? () => setShowVoiceInfo(true) : onVoiceToggle}
              className={`shrink-0 relative ${
                isRecording 
                  ? 'bg-red-50 border-red-200 animate-pulse' 
                  : isListening 
                    ? 'bg-blue-50 border-blue-200' 
                    : isMobile && !isSecureContext
                      ? 'bg-yellow-50 border-yellow-200'
                      : ''
              }`}
              title={
                isMobile && !isSecureContext 
                  ? t('voice.tooltip.https')
                  : isRecording 
                    ? t('voice.tooltip.stop')
                    : t('voice.tooltip.start')
              }
            >
              {isMobile && !isSecureContext ? (
                <Shield className="h-4 w-4 text-yellow-600" />
              ) : (
                <Mic className={`h-4 w-4 ${
                  isRecording 
                    ? 'text-red-500' 
                    : isListening 
                      ? 'text-blue-500' 
                      : ''
                }`} />
              )}
              {isListening && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
              )}
            </Button>
            
            {/* HTTPS info popup */}
            {showVoiceInfo && (
              <div className="absolute bottom-full mb-2 right-0 bg-black text-white text-xs rounded-lg p-3 w-64 z-50">
                <div className="text-yellow-300 font-medium mb-1">{t('voice.https.title')}</div>
                <div className="mb-2">{t('voice.https.description')}</div>
                <div className="text-gray-300">{t('voice.https.suggestion')}</div>
                <button 
                  onClick={() => setShowVoiceInfo(false)}
                  className="absolute top-1 right-2 text-gray-400 hover:text-white"
                >
                  ×
                </button>
                <div className="absolute top-full right-4 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-black"></div>
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || (!input.trim() && !files?.length)}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};