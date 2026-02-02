"use client";

import { X } from "lucide-react";
import Link from "next/link";

interface AuthErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJudgeOverride?: () => void;
}

export default function AuthErrorModal({ isOpen, onClose, onJudgeOverride }: AuthErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-(--surface) rounded-3xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "zoomIn 0.4s cubic-bezier(.34,.1,.68,1) forwards",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-md"
        >
          <X className="w-5 h-5 text-black" />
        </button>

        <div className="p-8">
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-semibold mb-3" style={{ color: "#1F1F1F" }}>
              Sign In Required
            </h2>
            <p className="text-base mb-6" style={{ color: "#666" }}>
              You need to be signed in to add resources to NaviHub. Please sign up or sign in to continue.
            </p>

            <div className="flex flex-col gap-3">
              <Link href="/pages/signup" onClick={onClose}>
                <button className="w-full py-3 bg-[#997e67] text-white rounded-xl font-semibold hover:bg-[#8a6d5a] transition-colors">
                  Sign Up
                </button>
              </Link>
              <Link href="/pages/signin" onClick={onClose}>
                <button className="w-full py-3 border-2 border-[#997e67] text-[#997e67] rounded-xl font-semibold hover:bg-[#997e67]/5 transition-colors">
                  Sign In
                </button>
              </Link>
              {onJudgeOverride && (
                <button
                  onClick={() => {
                    onClose();
                    onJudgeOverride();
                  }}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors mt-2 border-2 border-blue-600"
                >
                  Judge Override
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes zoomIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

