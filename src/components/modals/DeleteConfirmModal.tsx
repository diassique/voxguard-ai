'use client';

import { AlertTriangle } from 'lucide-react';
import BaseModal from './BaseModal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDeleting = false,
}: DeleteConfirmModalProps) {
  const footer = (
    <div className="flex gap-3">
      <button
        onClick={onClose}
        disabled={isDeleting}
        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {cancelText}
      </button>
      <button
        onClick={onConfirm}
        disabled={isDeleting}
        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isDeleting ? 'Deleting...' : confirmText}
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={AlertTriangle}
      iconBgColor="bg-red-100"
      iconColor="text-red-600"
      footer={footer}
      maxWidth="md"
    >
      <p className="text-gray-600">{message}</p>
    </BaseModal>
  );
}
