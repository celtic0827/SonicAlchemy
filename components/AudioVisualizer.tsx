import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioRef, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Setup Audio Context and Analyser only once
    const initAudio = () => {
      if (!audioRef.current || audioContextRef.current) return;

      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        
        // Create analyser
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256; // Controls bar density
        
        // Connect audio element source
        // Note: We check if source exists to prevent "MediaElementAudioSourceNode" re-creation error if React strict mode remounts
        // However, a MediaElement can only have one source node.
        // In this app, audioRef belongs to TrackDetailView which is unmounted when leaving.
        // So safe to create new source if visualizer mounts.
        
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioContextRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;
      } catch (e) {
        console.warn("Audio Context setup failed (likely CORS or state)", e);
      }
    };

    if (isPlaying && !audioContextRef.current) {
      initAudio();
    }

    if (audioContextRef.current?.state === 'suspended' && isPlaying) {
        audioContextRef.current.resume();
    }

  }, [audioRef, isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        return;
    }

    const renderFrame = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;

        // Gradient for Gold look
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, '#f59e0b'); // Amber 500
        gradient.addColorStop(1, '#78350f'); // Amber 900

        ctx.fillStyle = gradient;
        // Rounded top bars
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-16 bg-slate-950/50 rounded border border-slate-900 mt-2"
      width={600}
      height={100}
    />
  );
};

export default AudioVisualizer;