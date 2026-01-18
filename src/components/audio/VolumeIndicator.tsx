"use client";

import { memo } from "react";
import type { AudioAnalysis } from "@/hooks/useAudioAnalyzer";

interface VolumeIndicatorProps {
  analysis: AudioAnalysis;
  isRecording: boolean;
  showLabels?: boolean;
  variant?: "horizontal" | "minimal" | "professional";
  className?: string;
}

// Профессиональный индикатор громкости
function ProfessionalIndicator({
  analysis,
  isRecording,
}: {
  analysis: AudioAnalysis;
  isRecording: boolean;
}) {
  const { volume, bass, mid, treble, isSpeaking } = analysis;

  const levels = [
    { label: "Low", value: bass, gradient: "from-orange-400 to-red-500" },
    { label: "Mid", value: mid, gradient: "from-orange-300 to-orange-500" },
    { label: "High", value: treble, gradient: "from-yellow-400 to-orange-400" },
  ];

  return (
    <div className="space-y-3">
      {/* Main Volume Bar */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Level</span>
            {isRecording && isSpeaking && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-md">
                ACTIVE
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-gray-500">
            {isRecording ? `${Math.round(volume * 100)}%` : "—"}
          </span>
        </div>

        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          {/* Background segments */}
          <div className="absolute inset-0 flex">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-white/30 last:border-0"
              />
            ))}
          </div>

          {/* Active level */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-75 bg-gradient-to-r from-[#FF6B35] via-[#FF8F5F] to-[#FFB088]"
            style={{ width: `${isRecording ? Math.min(volume * 100, 100) : 0}%` }}
          />

          {/* Glow effect */}
          {isRecording && volume > 0.3 && (
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#FF6B35] to-transparent opacity-50 blur-sm"
              style={{ width: `${Math.min(volume * 100, 100)}%` }}
            />
          )}
        </div>
      </div>

      {/* Frequency Bands */}
      <div className="grid grid-cols-3 gap-3">
        {levels.map(({ label, value, gradient }) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                {label}
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                {isRecording ? Math.round(value * 100) : 0}
              </span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-100 bg-gradient-to-r ${gradient}`}
                style={{ width: `${isRecording ? value * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Минималистичный индикатор (5 точек)
function MinimalIndicator({
  analysis,
  isRecording,
}: {
  analysis: AudioAnalysis;
  isRecording: boolean;
}) {
  const { volume, frequencyData, isSpeaking } = analysis;
  const bars = 5;

  return (
    <div className="flex items-center justify-center gap-1 h-6">
      {Array.from({ length: bars }).map((_, i) => {
        const freqIndex = Math.floor((i / bars) * frequencyData.length * 0.4);
        const value = isRecording ? Math.max(frequencyData[freqIndex] / 255, volume * 0.3) : 0;
        const height = Math.max(4, value * 24);

        return (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-100"
            style={{
              height: `${height}px`,
              backgroundColor: isRecording && value > 0.1
                ? `hsl(${20 + i * 3}, 90%, ${55 + value * 15}%)`
                : "#D1D5DB",
              boxShadow: isRecording && value > 0.5
                ? `0 0 8px hsla(${20 + i * 3}, 90%, 55%, 0.5)`
                : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// Горизонтальный простой индикатор
function HorizontalIndicator({
  analysis,
  isRecording,
  showLabels,
}: {
  analysis: AudioAnalysis;
  isRecording: boolean;
  showLabels: boolean;
}) {
  const { volume, isSpeaking } = analysis;

  return (
    <div className="space-y-1">
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Volume</span>
          <span className="text-gray-600 font-mono">
            {isRecording ? `${Math.round(volume * 100)}%` : "—"}
          </span>
        </div>
      )}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FF6B35] to-[#FF8F5F] rounded-full transition-all duration-75"
          style={{ width: `${isRecording ? volume * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

function VolumeIndicatorComponent({
  analysis,
  isRecording,
  showLabels = true,
  variant = "professional",
  className = "",
}: VolumeIndicatorProps) {
  switch (variant) {
    case "minimal":
      return (
        <div className={className}>
          <MinimalIndicator analysis={analysis} isRecording={isRecording} />
        </div>
      );
    case "horizontal":
      return (
        <div className={className}>
          <HorizontalIndicator
            analysis={analysis}
            isRecording={isRecording}
            showLabels={showLabels}
          />
        </div>
      );
    case "professional":
    default:
      return (
        <div className={className}>
          <ProfessionalIndicator analysis={analysis} isRecording={isRecording} />
        </div>
      );
  }
}

export const VolumeIndicator = memo(VolumeIndicatorComponent);
