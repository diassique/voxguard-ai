import { useCallback, useRef, useState, useEffect } from "react";

export interface AudioAnalysis {
  // Общая громкость (0-1)
  volume: number;
  // Частотные данные для визуализации (0-255 для каждой полосы)
  frequencyData: Uint8Array;
  // Временные данные для waveform (волновая форма)
  waveformData: Uint8Array;
  // Уровень низких частот (басы)
  bass: number;
  // Уровень средних частот
  mid: number;
  // Уровень высоких частот
  treble: number;
  // Обнаружен ли голос (простой VAD)
  isSpeaking: boolean;
  // Пиковый уровень (для индикатора клиппинга)
  peak: number;
}

interface UseAudioAnalyzerOptions {
  fftSize?: number; // Размер FFT (влияет на точность частотного анализа)
  smoothingTimeConstant?: number; // Сглаживание (0-1)
  minDecibels?: number;
  maxDecibels?: number;
}

export function useAudioAnalyzer(options: UseAudioAnalyzerOptions = {}) {
  const {
    fftSize = 256,
    smoothingTimeConstant = 0.8,
    minDecibels = -90,
    maxDecibels = -10,
  } = options;

  const [analysis, setAnalysis] = useState<AudioAnalysis>({
    volume: 0,
    frequencyData: new Uint8Array(fftSize / 2),
    waveformData: new Uint8Array(fftSize),
    bass: 0,
    mid: 0,
    treble: 0,
    isSpeaking: false,
    peak: 0,
  });

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Вычисление среднего значения в диапазоне частот
  const getAverageInRange = useCallback(
    (dataArray: Uint8Array, startIndex: number, endIndex: number) => {
      let sum = 0;
      const count = endIndex - startIndex;
      for (let i = startIndex; i < endIndex; i++) {
        sum += dataArray[i];
      }
      return count > 0 ? sum / count / 255 : 0;
    },
    []
  );

  // Анализ аудио в реальном времени
  const analyze = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const waveformData = new Uint8Array(analyser.fftSize);

    // Получаем данные
    analyser.getByteFrequencyData(frequencyData);
    analyser.getByteTimeDomainData(waveformData);

    // Вычисляем общую громкость (RMS)
    let sumSquares = 0;
    let peak = 0;
    for (let i = 0; i < waveformData.length; i++) {
      const normalized = (waveformData[i] - 128) / 128;
      sumSquares += normalized * normalized;
      const absValue = Math.abs(normalized);
      if (absValue > peak) peak = absValue;
    }
    const volume = Math.sqrt(sumSquares / waveformData.length);

    // Разделяем частоты на диапазоны
    // Низкие: 0-250Hz, Средние: 250-2000Hz, Высокие: 2000-8000Hz
    const nyquist = (audioContextRef.current?.sampleRate || 44100) / 2;
    const binWidth = nyquist / bufferLength;

    const bassEnd = Math.floor(250 / binWidth);
    const midEnd = Math.floor(2000 / binWidth);
    const trebleEnd = Math.floor(8000 / binWidth);

    const bass = getAverageInRange(frequencyData, 0, bassEnd);
    const mid = getAverageInRange(frequencyData, bassEnd, midEnd);
    const treble = getAverageInRange(frequencyData, midEnd, trebleEnd);

    // Простой VAD (Voice Activity Detection)
    const isSpeaking = volume > 0.02 && mid > 0.1;

    setAnalysis({
      volume: Math.min(volume * 3, 1), // Усиливаем для лучшей визуализации
      frequencyData,
      waveformData,
      bass,
      mid,
      treble,
      isSpeaking,
      peak,
    });

    // Продолжаем анализ
    animationFrameRef.current = requestAnimationFrame(analyze);
  }, [getAverageInRange]);

  // Подключение к MediaStream
  const connectStream = useCallback(
    async (stream: MediaStream) => {
      // Очищаем предыдущие ресурсы
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }

      // Создаём AudioContext если нужно
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;

      // Создаём AnalyserNode
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;
      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = maxDecibels;
      analyserRef.current = analyser;

      // Подключаем stream к analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
      streamRef.current = stream;

      // Запускаем анализ
      analyze();
    },
    [fftSize, smoothingTimeConstant, minDecibels, maxDecibels, analyze]
  );

  // Отключение
  const disconnect = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    // Сбрасываем анализ
    setAnalysis({
      volume: 0,
      frequencyData: new Uint8Array(fftSize / 2),
      waveformData: new Uint8Array(fftSize),
      bass: 0,
      mid: 0,
      treble: 0,
      isSpeaking: false,
      peak: 0,
    });
  }, [fftSize]);

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [disconnect]);

  return {
    analysis,
    connectStream,
    disconnect,
    analyser: analyserRef.current,
  };
}
