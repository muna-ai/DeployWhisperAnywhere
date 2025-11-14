'use client';

import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Muna } from 'muna';
import { useAudioUpload } from '../hooks/useAudioUpload';
import { useWaveform } from '../hooks/useWaveform';

export default function Home() {
  const [transcription, setTranscription] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);

  // Use custom hook for audio handling
  const { audioArray, loadAudio, isLoadingAudio, audioFileName } = useAudioUpload();

  // Use waveform hook to visualize audio
  useWaveform({ audioArray, canvasRef: waveformCanvasRef });

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      loadAudio(file);
      setTranscription('');
      setError(null);
    }
  }, [loadAudio]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.webm'] },
    multiple: false
  });

  // Run transcription
  const runTranscription = async () => {
    if (!audioArray) {
      setError('Please upload an audio file');
      return;
    }

    setIsTranscribing(true);
    setError(null);
    setTranscription('');

    try {
      const muna = new Muna({ url: '/api' });

      // Reshape audio to match expected input format (1, N)
      // Convert Float32Array to a 2D array structure
      const audioInput = Array.from(audioArray);

      const prediction = await muna.predictions.create({
        tag: '@my-muna-id/whisper',
        inputs: {
          audio: [audioInput] // Shape: (1, N)
        }
      });

      if (prediction.error) {
        throw new Error(prediction.error);
      }

      if (prediction.results && prediction.results.length > 0) {
        const transcriptionText = prediction.results[0] as string;
        console.log('Transcription:', transcriptionText);
        setTranscription(transcriptionText);
      } else {
        setTranscription('(No transcription returned)');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during transcription');
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Whisper Transcription
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload an audio file to transcribe it with Whisper via Muna
          </p>
        </header>

        <div className="space-y-6">
          {/* Audio Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Upload Audio
            </h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors min-h-[120px] flex items-center justify-center ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-blue-500 dark:text-blue-400">Drop the audio file here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    Drag & drop an audio file here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    or click to select (WAV, MP3, M4A, FLAC, OGG, WebM)
                  </p>
                </div>
              )}
            </div>

            {/* File Info - Always reserve space */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded min-h-[60px]">
              {audioFileName ? (
                <>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">File:</span> {audioFileName}
                  </p>
                  {audioArray && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Duration: {(audioArray.length / 16000).toFixed(2)} seconds
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  No file selected
                </p>
              )}
            </div>

            {/* Waveform Visualization - Always reserve space */}
            <div className="mt-4 h-[100px] rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
              {audioArray ? (
                <canvas
                  ref={waveformCanvasRef}
                  className="w-full h-full rounded"
                />
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Waveform will appear here
                </p>
              )}
            </div>

            <button
              onClick={runTranscription}
              disabled={!audioArray || isTranscribing || isLoadingAudio}
              className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
            </button>
          </div>

          {/* Transcription Result */}
          {transcription && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Transcription
              </h2>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded border-l-4 border-green-500">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {transcription}
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
