import { useEffect, useRef } from 'react';

interface UseSpectrogramProps {
  audioArray: Float32Array | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

/**
 * Hook to generate and display a spectrogram visualization
 * Uses FFT to compute frequency content over time
 */
export function useSpectrogram({ audioArray, canvasRef }: UseSpectrogramProps) {
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    if (!audioArray || !canvasRef.current || isGeneratingRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isGeneratingRef.current = true;

    const generateSpectrogram = async () => {
      const sampleRate = 16000;
      const fftSize = 512; // FFT window size
      const hopSize = 256; // Hop between windows (50% overlap)

      // Set canvas size
      const width = 800;
      const height = 256;
      canvas.width = width;
      canvas.height = height;

      // Calculate number of frames
      const numFrames = Math.floor((audioArray.length - fftSize) / hopSize) + 1;
      const framesPerPixel = Math.ceil(numFrames / width);

      // Create offline audio context for FFT analysis
      const offlineCtx = new OfflineAudioContext(1, audioArray.length, sampleRate);
      const audioBuffer = offlineCtx.createBuffer(1, audioArray.length, sampleRate);
      audioBuffer.copyToChannel(audioArray, 0);

      // Compute spectrogram using AnalyserNode
      const analyser = offlineCtx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0;

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      source.start(0);

      // We'll compute the spectrogram manually since we need frame-by-frame control
      const frequencyData: Uint8Array[] = [];

      // Process each frame
      for (let i = 0; i < numFrames; i++) {
        const frameStart = i * hopSize;
        const frameEnd = Math.min(frameStart + fftSize, audioArray.length);

        if (frameEnd - frameStart < fftSize) break;

        // Compute magnitude spectrum using simple FFT approximation
        const frame = audioArray.slice(frameStart, frameEnd);
        const spectrum = computeSpectrum(frame);
        frequencyData.push(spectrum);
      }

      // Draw spectrogram
      const imageData = ctx.createImageData(width, height);
      const freqBinsPerPixel = Math.ceil(frequencyData[0].length / height);

      for (let x = 0; x < width; x++) {
        const frameIndex = Math.floor(x * numFrames / width);
        if (frameIndex >= frequencyData.length) break;

        const spectrum = frequencyData[frameIndex];

        for (let y = 0; y < height; y++) {
          // Map y to frequency bin (flip so low frequencies are at bottom)
          const freqBin = Math.floor((height - 1 - y) * spectrum.length / height);
          const magnitude = spectrum[freqBin];

          // Convert magnitude to color (using a blue-green-yellow-red colormap)
          const pixelIndex = (y * width + x) * 4;
          const color = magnitudeToColor(magnitude);
          imageData.data[pixelIndex] = color.r;
          imageData.data[pixelIndex + 1] = color.g;
          imageData.data[pixelIndex + 2] = color.b;
          imageData.data[pixelIndex + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      isGeneratingRef.current = false;
    };

    generateSpectrogram();

    return () => {
      isGeneratingRef.current = false;
    };
  }, [audioArray, canvasRef]);
}

/**
 * Compute magnitude spectrum using a simple DFT approximation
 * Returns Uint8Array with magnitude values scaled 0-255
 */
function computeSpectrum(frame: Float32Array): Uint8Array {
  const fftSize = frame.length;
  const halfSize = Math.floor(fftSize / 2);
  const spectrum = new Uint8Array(halfSize);

  // Apply Hann window
  const windowedFrame = new Float32Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)));
    windowedFrame[i] = frame[i] * window;
  }

  // Compute magnitude spectrum (simple DFT for first half of frequencies)
  for (let k = 0; k < halfSize; k++) {
    let real = 0;
    let imag = 0;

    for (let n = 0; n < fftSize; n++) {
      const angle = -2 * Math.PI * k * n / fftSize;
      real += windowedFrame[n] * Math.cos(angle);
      imag += windowedFrame[n] * Math.sin(angle);
    }

    // Magnitude and scale to 0-255
    const magnitude = Math.sqrt(real * real + imag * imag);
    const db = 20 * Math.log10(magnitude + 1e-10);
    const normalized = Math.max(0, Math.min(255, (db + 100) * 2.55));
    spectrum[k] = normalized;
  }

  return spectrum;
}

/**
 * Convert magnitude value (0-255) to RGB color
 * Uses a perceptual colormap: dark blue -> cyan -> yellow -> red
 */
function magnitudeToColor(value: number): { r: number; g: number; b: number } {
  const normalized = value / 255;

  if (normalized < 0.25) {
    // Dark blue to blue
    const t = normalized / 0.25;
    return { r: 0, g: 0, b: Math.floor(50 + t * 205) };
  } else if (normalized < 0.5) {
    // Blue to cyan
    const t = (normalized - 0.25) / 0.25;
    return { r: 0, g: Math.floor(t * 255), b: 255 };
  } else if (normalized < 0.75) {
    // Cyan to yellow
    const t = (normalized - 0.5) / 0.25;
    return { r: Math.floor(t * 255), g: 255, b: Math.floor(255 * (1 - t)) };
  } else {
    // Yellow to red
    const t = (normalized - 0.75) / 0.25;
    return { r: 255, g: Math.floor(255 * (1 - t)), b: 0 };
  }
}
