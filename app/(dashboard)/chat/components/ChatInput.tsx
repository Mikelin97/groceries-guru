import { useRef, useState } from 'react';
import { Send, Mic, Camera, Shield, X, FileText, Upload } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  isListening: boolean;
  files: FileList | undefined;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onVoiceToggle: () => void;
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      // Validate files before accepting them
      const validFiles = Array.from(event.target.files).filter(file => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
          alert(`File type ${file.type} is not supported. Only images and PDFs are allowed.`);
          return false;
        }
        
        if (file.size > maxSize) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          return false;
        }
        
        return true;
      });
      
      if (validFiles.length > 0) {
        // Create FileList from valid files
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));
        onFilesChange(dataTransfer.files);
      } else {
        onFilesChange(undefined);
      }
    }
  };

  const removeFile = (index: number) => {
    if (files && files.length > 1) {
      const dataTransfer = new DataTransfer();
      Array.from(files).forEach((file, i) => {
        if (i !== index) dataTransfer.items.add(file);
      });
      onFilesChange(dataTransfer.files);
    } else {
      onFilesChange(undefined);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          
          {/* Enhanced File preview */}
          {files && files.length > 0 && (
            <div className="absolute bottom-full mb-2 flex flex-wrap gap-2 max-w-lg">
              {Array.from(files).map((file, index) => {
                const isImage = file.type.startsWith('image/');
                const isPDF = file.type === 'application/pdf';
                
                return (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm relative group max-w-xs">
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {isImage ? (
                        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : isPDF ? (
                        <div className="w-12 h-12 rounded bg-red-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-red-500" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-50 flex items-center justify-center flex-shrink-0">
                          <Upload className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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