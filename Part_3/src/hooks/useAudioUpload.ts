import { useState, useCallback, useRef } from 'react';

interface UseAudioUploadReturn {
  audioArray: Float32Array | null;
  loadAudio: (file: File) => Promise<void>;
  isLoadingAudio: boolean;
  audioFileName: string | null;
}

/**
 * Hook to handle audio uploads and convert them to 16kHz mono Float32Array
 * Expected format matches Whisper input: Float32Array at 16kHz sample rate
 */
export function useAudioUpload(): UseAudioUploadReturn {
  const [audioArray, setAudioArray] = useState<Float32Array | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const loadAudio = useCallback(async (file: File) => {
    if (!file) return;

    setIsLoadingAudio(true);
    setAudioFileName(file.name);

    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 16000 });

      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Convert to mono if needed
      let audioData: Float32Array;
      if (audioBuffer.numberOfChannels === 1) {
        audioData = audioBuffer.getChannelData(0);
      } else {
        // Mix down to mono by averaging all channels
        const length = audioBuffer.length;
        audioData = new Float32Array(length);
        for (let i = 0; i < length; i++) {
          let sum = 0;
          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            sum += audioBuffer.getChannelData(channel)[i];
          }
          audioData[i] = sum / audioBuffer.numberOfChannels;
        }
      }

      if (!isMountedRef.current) return;

      console.log(`Audio loaded: ${audioData.length} samples at 16kHz (${(audioData.length / 16000).toFixed(2)}s)`);
      setAudioArray(audioData);
    } catch (error) {
      console.error('Failed to load audio:', error);
      if (isMountedRef.current) {
        setAudioArray(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingAudio(false);
      }
    }
  }, []);

  return { audioArray, loadAudio, isLoadingAudio, audioFileName };
}
