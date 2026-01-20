'use client';

import { ReactNode } from 'react';
import { X, LucideIcon } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export default function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-red-100',
  iconColor = 'text-red-600',
  children,
  loading = false,
  loadingText = 'Loading...',
  footer,
  maxWidth = '3xl',
}: BaseModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl ${maxWidthClasses[maxWidth]} w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${iconBgColor} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-modal-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 mt-4">{loadingText}</p>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-6 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>

      <style jsx>{`
        /* Overlay scrollbar - doesn't take up space */
        .custom-modal-scrollbar {
          overflow-y: overlay;
        }

        /* Fallback for browsers that don't support overlay */
        @supports not (overflow-y: overlay) {
          .custom-modal-scrollbar {
            overflow-y: auto;
          }
        }

        .custom-modal-scrollbar::-webkit-scrollbar {
          width: 10px;
        }

        .custom-modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-modal-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 10px;
          border: 3px solid transparent;
          background-clip: content-box;
        }

        .custom-modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.5);
        }

        /* Firefox */
        .custom-modal-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
        }
      `}</style>
    </div>
  );
}
