"use client";

import { useEffect, useRef, memo } from "react";
import type { AudioAnalysis } from "@/hooks/useAudioAnalyzer";

interface AudioVisualizerProps {
  analysis: AudioAnalysis;
  isRecording: boolean;
  variant?: "waveform" | "bars" | "circular";
  className?: string;
}

// Чёткий визуализатор баров на всю ширину
function PremiumBarsVisualizer({
  analysis,
  isRecording,
}: {
  analysis: AudioAnalysis;
  isRecording: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const smoothedDataRef = useRef<number[]>([]);
  const lastDprRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const barCount = 48;

    // Инициализация сглаженных данных один раз
    if (smoothedDataRef.current.length !== barCount) {
      smoothedDataRef.current = new Array(barCount).fill(0);
    }

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const newWidth = Math.floor(rect.width * dpr);
      const newHeight = Math.floor(rect.height * dpr);

      // Всегда пересчитываем при изменении размера или DPR (zoom)
      if (canvas.width !== newWidth || canvas.height !== newHeight || lastDprRef.current !== dpr) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        lastDprRef.current = dpr;
      }

      // Сбрасываем transform и устанавливаем scale каждый кадр для чёткости
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;

      const width = rect.width;
      const height = rect.height;
      const { frequencyData, volume } = analysis;

      // Очищаем canvas
      ctx.clearRect(0, 0, width, height);

      // Параметры точек - фиксированный размер, центрирование
      const gap = 5;
      const dotSize = 6; // Диаметр круга
      const totalDotsWidth = barCount * dotSize + (barCount - 1) * gap;
      const startX = (width - totalDotsWidth) / 2; // Центрирование
      const centerY = height / 2;
      const maxBarHeight = height * 0.9;

      // Цвета
      const activeColor = "#FF6B35";
      const inactiveColor = "#D1D5DB";

      for (let i = 0; i < barCount; i++) {
        // Симметричный паттерн от центра для визуального эффекта
        const normalizedIndex = i / (barCount - 1);
        const distFromCenter = Math.abs(normalizedIndex - 0.5) * 2;

        // Маппинг частот - низкие частоты в центре, высокие по краям
        const freqIndex = Math.floor(distFromCenter * frequencyData.length * 0.6);

        let targetValue = 0;
        if (isRecording && frequencyData.length > 0) {
          const freqValue = frequencyData[freqIndex] / 255;
          // Центральные бары реагируют сильнее
          const centerMultiplier = 1 - distFromCenter * 0.4;
          targetValue = Math.pow(freqValue, 0.8) * centerMultiplier * (0.5 + volume * 0.5);
        }

        // Плавное сглаживание с разной скоростью
        const currentValue = smoothedDataRef.current[i];
        const ease = targetValue > currentValue ? 0.35 : 0.12;
        smoothedDataRef.current[i] += (targetValue - currentValue) * ease;

        const value = smoothedDataRef.current[i];
        const x = startX + i * (dotSize + gap);

        // Минимальная высота для неактивных баров
        const minHeight = 4;
        const barHeight = Math.max(minHeight, value * maxBarHeight);

        // Радиус закругления - полностью круглые концы
        const radius = dotSize / 2;

        // Цвет в зависимости от активности
        ctx.fillStyle = value > 0.03 ? activeColor : inactiveColor;

        // Рисуем палочку с идеально круглыми концами
        const y = centerY - barHeight / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, dotSize, barHeight, radius);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analysis, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl"
      style={{
        display: "block",
        height: "96px",
      }}
    />
  );
}

// Siri-style визуализатор (плавные волны)
function SiriWaveVisualizer({
  analysis,
  isRecording,
}: {
  analysis: AudioAnalysis;
  isRecording: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const { volume, frequencyData, isSpeaking } = analysis;

      // Фон
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, "#FAFAFA");
      bgGradient.addColorStop(1, "#F5F5F5");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      if (!isRecording) {
        // Статичная линия
        ctx.strokeStyle = "#E5E7EB";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const centerY = height / 2;
      phaseRef.current += 0.04;

      // Рисуем несколько слоёв волн
      const layers = [
        { color: "rgba(255, 107, 53, 0.7)", amplitude: 1.0, speed: 1.0, frequency: 0.015 },
        { color: "rgba(255, 130, 80, 0.5)", amplitude: 0.75, speed: 1.2, frequency: 0.02 },
        { color: "rgba(255, 160, 110, 0.35)", amplitude: 0.5, speed: 0.85, frequency: 0.012 },
      ];

      layers.forEach((layer, layerIndex) => {
        ctx.beginPath();
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = 3.5 - layerIndex * 0.8;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (let x = 0; x <= width; x += 1) {
          const freqIndex = Math.floor((x / width) * frequencyData.length * 0.5);
          const freqValue = frequencyData[freqIndex] / 255;

          // Комбинируем несколько синусоид для органичного движения
          const wave1 = Math.sin(x * layer.frequency + phaseRef.current * layer.speed);
          const wave2 = Math.sin(x * layer.frequency * 1.5 + phaseRef.current * layer.speed * 0.7) * 0.3;
          const baseWave = wave1 + wave2;

          const amplitude = (15 + volume * 35 + freqValue * 25) * layer.amplitude;
          const y = centerY + baseWave * amplitude * (isSpeaking ? 1 : 0.25);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      });

      // Центральный glow при говорении
      if (isSpeaking && volume > 0.15) {
        const gradient = ctx.createRadialGradient(
          width / 2, centerY, 0,
          width / 2, centerY, width * 0.35
        );
        gradient.addColorStop(0, `rgba(255, 107, 53, ${volume * 0.12})`);
        gradient.addColorStop(1, "rgba(255, 107, 53, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analysis, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-24 rounded-xl"
      style={{ display: "block" }}
    />
  );
}

// Круговой "орб" визуализатор
function OrbVisualizer({
  analysis,
  isRecording,
}: {
  analysis: AudioAnalysis;
  isRecording: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const { frequencyData, volume, isSpeaking } = analysis;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.3;

      ctx.clearRect(0, 0, width, height);

      rotationRef.current += isRecording ? 0.008 : 0.002;

      if (!isRecording) {
        // Статичный круг
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "#E5E7EB";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Внутренний круг
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = "#F3F4F6";
        ctx.fill();

        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Внешнее свечение
      if (isSpeaking) {
        const glowRadius = baseRadius * (1.4 + volume * 0.4);
        const gradient = ctx.createRadialGradient(
          centerX, centerY, baseRadius * 0.7,
          centerX, centerY, glowRadius
        );
        gradient.addColorStop(0, `rgba(255, 107, 53, ${volume * 0.25})`);
        gradient.addColorStop(0.6, `rgba(255, 130, 90, ${volume * 0.1})`);
        gradient.addColorStop(1, "rgba(255, 107, 53, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Волнистый круг на основе частот
      const points = 72;
      ctx.beginPath();

      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2 + rotationRef.current;
        const freqIndex = Math.floor((i / points) * frequencyData.length * 0.6);
        const freqValue = frequencyData[freqIndex] / 255;

        const radiusOffset = freqValue * baseRadius * 0.35;
        const radius = baseRadius + radiusOffset;

        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();

      // Градиентная заливка
      const fillGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius * 1.4
      );
      fillGradient.addColorStop(0, "rgba(255, 107, 53, 0.08)");
      fillGradient.addColorStop(0.6, `rgba(255, 107, 53, ${0.12 + volume * 0.15})`);
      fillGradient.addColorStop(1, "rgba(255, 130, 100, 0.03)");
      ctx.fillStyle = fillGradient;
      ctx.fill();

      // Обводка
      ctx.strokeStyle = "#FF6B35";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Центральный круг (индикатор активности)
      const innerRadius = baseRadius * (0.18 + volume * 0.12);
      const innerGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, innerRadius
      );
      innerGradient.addColorStop(0, isSpeaking ? "#FF6B35" : "#9CA3AF");
      innerGradient.addColorStop(1, isSpeaking ? "#FF8F5F" : "#D1D5DB");

      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = innerGradient;
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analysis, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}

// Основной компонент
function AudioVisualizerComponent({
  analysis,
  isRecording,
  variant = "bars",
  className = "",
}: AudioVisualizerProps) {
  switch (variant) {
    case "waveform":
      return (
        <div className={className}>
          <SiriWaveVisualizer analysis={analysis} isRecording={isRecording} />
        </div>
      );
    case "circular":
      return (
        <div className={className}>
          <OrbVisualizer analysis={analysis} isRecording={isRecording} />
        </div>
      );
    case "bars":
    default:
      return (
        <div className={className}>
          <PremiumBarsVisualizer analysis={analysis} isRecording={isRecording} />
        </div>
      );
  }
}

export const AudioVisualizer = memo(AudioVisualizerComponent);
