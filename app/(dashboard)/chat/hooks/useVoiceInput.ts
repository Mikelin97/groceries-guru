import { useState, useCallback } from 'react';

export const useVoiceInput = (onTranscript: (text: string) => void, currentInput?: string) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);

  const handleVoiceToggle = useCallback(async () => {
    if (!isRecording) {
      // Start recording
      console.log('=== VOICE INPUT: Starting ===');
      console.log('User agent:', navigator.userAgent);
      console.log('Is HTTPS:', location.protocol === 'https:');
      console.log('MediaDevices available:', !!navigator.mediaDevices);
      console.log('getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);
      
      // Check if we're on HTTP (not HTTPS)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        alert('Voice input requires HTTPS on mobile devices. Please use HTTPS or localhost.');
        return;
      }

      // Check if media devices are supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Voice input is not supported on this device/browser.');
        return;
      }

      try {
        console.log('Requesting microphone access...');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        console.log('Microphone access granted');
        
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/wav' });
          setAudioChunks([audioBlob]);
          
          // If no speech recognition result, try transcription API
          if (!currentInput || currentInput.trim() === '') {
            try {
              const formData = new FormData();
              formData.append('audio', audioBlob, 'recording.wav');
              
              const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
              });
              
              if (response.ok) {
                const result = await response.json();
                onTranscript(result.text);
              }
            } catch (error) {
              console.error('Transcription failed:', error);
            }
          }
          
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
        };

        setMediaRecorder(recorder);
        recorder.start();
        setIsRecording(true);

        // Clear existing input when starting new recording
        onTranscript('');

        // Also try browser speech recognition for real-time transcription
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          console.log('Speech recognition available, starting...');
          
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
          const recognition = new SpeechRecognition();
          
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            // Get only the latest result to avoid accumulating old results
            const lastResultIndex = event.results.length - 1;
            const lastResult = event.results[lastResultIndex];
            
            if (lastResult.isFinal) {
              // Final result - use the complete transcript
              const transcript = lastResult[0].transcript;
              onTranscript(transcript.trim());
            } else {
              // Interim result - show partial transcript
              const transcript = lastResult[0].transcript;
              onTranscript(transcript.trim());
            }
          };

          recognition.onstart = () => {
            console.log('Speech recognition started');
            setIsListening(true);
          };
          
          recognition.onend = () => {
            console.log('Speech recognition ended');
            setIsListening(false);
            // Auto-restart if we're still in recording mode for continuous conversation
            if (isRecording) {
              setTimeout(() => {
                try {
                  recognition.start();
                } catch (error) {
                  console.log('Speech recognition restart failed:', error);
                }
              }, 100);
            }
          };
          
          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
              alert('Microphone permission denied. Please allow microphone access and try again.');
            }
          };
          
          setSpeechRecognition(recognition);
          
          try {
            recognition.start();
          } catch (error) {
            console.error('Failed to start speech recognition:', error);
          }
        } else {
          console.log('Speech recognition not available');
        }

      } catch (error: any) {
        console.error('Error accessing microphone:', error);
        
        let errorMessage = 'Unable to access microphone. ';
        
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Please allow microphone access in your browser settings and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No microphone found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Microphone access is not supported on this device/browser.';
        } else if (error.name === 'NotReadableError') {
          errorMessage += 'Microphone is already in use by another application.';
        } else {
          errorMessage += 'Please check your device settings and permissions.';
        }
        
        alert(errorMessage);
      }
    } else {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      
      // Stop speech recognition
      if (speechRecognition) {
        speechRecognition.stop();
        setSpeechRecognition(null);
      }
      
      setIsRecording(false);
      setIsListening(false);
    }
  }, [isRecording, mediaRecorder, speechRecognition, onTranscript]);

  return {
    isRecording,
    isListening,
    audioChunks,
    handleVoiceToggle
  };
};