"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createCallSession,
  uploadAudioFile,
  processBatchTranscription,
} from "@/lib/supabase-recording";
import { useRouter } from "next/navigation";
import BaseModal from "./modals/BaseModal";

interface UploadAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

export default function UploadAudioModal({
  isOpen,
  onClose,
  onUploadComplete,
}: UploadAudioModalProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = useCallback(
    async (file: File) => {
      // Validate file type
      const allowedTypes = [
        "audio/mpeg", // MP3
        "audio/wav", // WAV
        "audio/x-wav",
        "audio/mp4", // M4A
        "audio/x-m4a",
        "audio/flac", // FLAC
        "audio/webm", // WebM
        "audio/ogg", // OGG
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type", {
          description:
            "Please upload an audio file (MP3, WAV, M4A, FLAC, WebM, OGG)",
        });
        return;
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error("File too large", {
          description: "Maximum file size is 50MB",
        });
        return;
      }

      setUploading(true);
      const uploadToast = toast.loading("Uploading audio file...");

      try {
        // 1. Create session
        const session = await createCallSession();
        if (!session) {
          throw new Error("Failed to create session");
        }

        console.log("✅ Session created:", session.id);

        // 2. Upload audio file
        const audioUrl = await uploadAudioFile(session.id, file);
        if (!audioUrl) {
          throw new Error("Failed to upload audio file");
        }

        console.log("✅ Audio uploaded:", audioUrl);
        toast.dismiss(uploadToast);

        // 3. Process with batch transcription
        const processingToast = toast.loading(
          "Transcribing with speaker detection..."
        );
        const result = await processBatchTranscription(session.id, audioUrl);
        toast.dismiss(processingToast);

        if (!result.success) {
          // Clean up: delete the session and audio file since transcription failed
          const supabase = (await import("@/lib/supabase")).createClient();

          // Delete session (this will cascade delete transcripts)
          await supabase.from("call_sessions").delete().eq("id", session.id);

          // Delete audio file from storage
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const fileName = `${user.id}/${session.id}.webm`;
            await supabase.storage.from("recordings").remove([fileName]);
          }

          toast.error("Transcription failed", {
            description: "No speech detected in the audio file. Please upload a file with clear speech.",
          });
          return;
        }

        if (result.success) {
          // Show success with compliance info
          if (result.alerts && result.alerts > 0) {
            if (result.criticalAlerts && result.criticalAlerts > 0) {
              toast.error(
                `Transcription complete - ${result.criticalAlerts} critical compliance alert(s) detected!`,
                {
                  description: `Total alerts: ${result.alerts}. Please review immediately.`,
                  duration: 5000,
                }
              );
            } else if (result.highAlerts && result.highAlerts > 0) {
              toast.warning(
                `Transcription complete - ${result.highAlerts} high-priority alert(s) detected`,
                {
                  description: `Total alerts: ${result.alerts}. Review recommended.`,
                  duration: 5000,
                }
              );
            } else {
              toast.success("Audio transcribed successfully!", {
                description: `${result.alerts} compliance alert(s) detected. Review recommended.`,
                duration: 3000,
              });
            }
          } else {
            toast.success("Audio transcribed successfully!", {
              description: "No compliance issues detected.",
            });
          }

          // Call callback
          if (onUploadComplete) {
            onUploadComplete();
          }

          // Close modal
          onClose();

          // Redirect to recording detail page
          setTimeout(() => {
            router.push(`/dashboard/recordings/${session.id}`);
          }, 1000);
        } else {
          toast.error("Transcription failed", {
            description: "Please try again or contact support",
          });
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Upload failed", {
          description:
            error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setUploading(false);
        toast.dismiss(uploadToast);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [router, onClose, onUploadComplete]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (uploading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [uploading, handleFileUpload]
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={uploading ? () => {} : onClose}
      title="Upload Audio File"
      subtitle="Upload an audio file for transcription and compliance analysis"
      icon={Upload}
      iconBgColor="bg-blue-50"
      iconColor="text-blue-600"
      maxWidth="2xl"
    >
      <div>
            {/* Upload Area */}
            <div
              onClick={handleUploadClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                uploading
                  ? "border-[#FF6B35] bg-[#FF6B35]/5 cursor-wait"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={uploading}
              />
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {uploading ? (
                  <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin" />
                ) : (
                  <Upload className="w-10 h-10 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {uploading ? "Processing..." : "Drop your audio file here"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {uploading
                  ? "Uploading and transcribing your audio file"
                  : "or click to browse from your computer"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Supports MP3, WAV, M4A, FLAC, WebM, OGG (max 50MB)
              </p>
            </div>

            {/* Info Section */}
            <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                What happens next?
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Your audio will be uploaded securely</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>AI will transcribe with speaker identification</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Compliance rules will be analyzed automatically</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>You'll be redirected to the recording details page</span>
                </div>
              </div>
            </div>
          </div>
    </BaseModal>
  );
}
