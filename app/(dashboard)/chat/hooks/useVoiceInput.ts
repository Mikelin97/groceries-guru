import { useState, useCallback } from 'react';

export const useVoiceInput = (onTranscript: (text: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);

  const handleVoiceToggle = useCallback(async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
          if (!onTranscript) {
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

          recognition.onstart = () => setIsListening(true);
          recognition.onend = () => {
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
          
          setSpeechRecognition(recognition);
          recognition.start();
        }

      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Unable to access microphone. Please check permissions.');
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