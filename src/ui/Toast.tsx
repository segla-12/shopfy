"use client";

import { useEffect } from "react";

export type ToastType = "success" | "error";

type ToastProps = {
  message: string;
  type: ToastType;
  onClose: () => void;
};

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    if (type === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  const baseClasses = "fixed bottom-5 right-5 z-50 max-w-sm rounded-lg p-4 text-sm font-bold shadow-lg";
  const typeClasses =
    type === "success"
      ? "bg-green-500 text-white"
      : "bg-red-500 text-white";

  return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
}