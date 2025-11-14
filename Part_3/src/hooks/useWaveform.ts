import { useEffect, useRef } from 'react';

interface UseWaveformProps {
  audioArray: Float32Array | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

/**
 * Hook to generate and display a simple waveform visualization
 */
export function useWaveform({ audioArray, canvasRef }: UseWaveformProps) {
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    if (!audioArray || !canvasRef.current || isGeneratingRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isGeneratingRef.current = true;

    // Set canvas size
    const width = 800;
    const height = 100;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const samplesPerPixel = Math.floor(audioArray.length / width);
    const midY = height / 2;

    for (let x = 0; x < width; x++) {
      const start = x * samplesPerPixel;
      const end = start + samplesPerPixel;

      // Find min and max in this segment for better visualization
      let min = 0;
      let max = 0;
      for (let i = start; i < end && i < audioArray.length; i++) {
        const sample = audioArray[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }

      // Draw line from min to max at this x position
      const minY = midY - min * midY;
      const maxY = midY - max * midY;

      if (x === 0) {
        ctx.moveTo(x, midY);
      }

      ctx.lineTo(x, maxY);
      ctx.lineTo(x, minY);
    }

    ctx.stroke();
    isGeneratingRef.current = false;

    return () => {
      isGeneratingRef.current = false;
    };
  }, [audioArray, canvasRef]);
}
