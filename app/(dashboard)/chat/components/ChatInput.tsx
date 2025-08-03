import { useRef } from 'react';
import { Send, Mic, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
            placeholder={isListening ? "Listening... speak now" : "Ask about any grocery product..."}
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
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onVoiceToggle}
            className={`shrink-0 relative ${
              isRecording 
                ? 'bg-red-50 border-red-200 animate-pulse' 
                : isListening 
                  ? 'bg-blue-50 border-blue-200' 
                  : ''
            }`}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            <Mic className={`h-4 w-4 ${
              isRecording 
                ? 'text-red-500' 
                : isListening 
                  ? 'text-blue-500' 
                  : ''
            }`} />
            {isListening && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
            )}
          </Button>
          
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