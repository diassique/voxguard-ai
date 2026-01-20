'use client';

import { AlertTriangle } from 'lucide-react';

interface ComplianceAlertBadgeProps {
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

/**
 * Animated Compliance Alert Badge Component
 *
 * Features:
 * - Pulse effect on the badge itself
 * - Ping/ripple effect radiating outward
 * - Gentle bounce on the icon
 * - Respects prefers-reduced-motion for accessibility
 *
 * Psychology:
 * - Creates urgency without stress
 * - Attracts attention naturally
 * - Encourages clicks through movement
 */
export default function ComplianceAlertBadge({
  onClick,
  children = 'Compliance Alert',
}: ComplianceAlertBadgeProps) {
  return (
    <>
      <button
        onClick={onClick}
        className="relative flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded font-medium hover:bg-red-100 transition-colors animate-pulse-subtle"
      >
        {/* Animated ring effect - radiates outward like a sonar */}
        <span className="absolute inset-0 rounded animate-ping-slow opacity-75 bg-red-200" />

        {/* Badge content */}
        <span className="relative flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 animate-bounce-gentle" />
          {children}
        </span>
      </button>

      <style jsx>{`
        /* Compliance Alert Badge Animations */
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1);
            opacity: 0.75;
          }
        }

        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        /* Accessibility: Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-subtle,
          .animate-ping-slow,
          .animate-bounce-gentle {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
