"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createQrMatrix, createQrSvg, qrCodePrintOptions } from "@/lib/qrCode";

type StoreQrCodeProps = {
  url: string;
  title: string;
  downloadLabel: string;
  fileName?: string;
};

const quietZone = qrCodePrintOptions.margin;
const canvasSize = qrCodePrintOptions.rasterSize;

export function StoreQrCode({ url, title, downloadLabel, fileName = "shopfy-store-qr.png" }: StoreQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const absoluteUrl = useMemo(() => {
    if (url.startsWith("http")) return url;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    return new URL(url, siteUrl).href;
  }, [url]);
  const svgPreview = useMemo(() => {
    try {
      return createQrSvg(absoluteUrl);
    } catch {
      return "";
    }
  }, [absoluteUrl]);

  useEffect(() => {
    let nextErrorMessage = "";
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    try {
      const matrix = createQrMatrix(absoluteUrl);
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      const moduleCount = matrix.length + quietZone * 2;
      const moduleSize = Math.floor(canvasSize / moduleCount);
      const qrSize = moduleSize * moduleCount;
      const offset = Math.floor((canvasSize - qrSize) / 2);

      canvas.width = canvasSize;
      canvas.height = canvasSize;
      context.imageSmoothingEnabled = false;
      context.fillStyle = qrCodePrintOptions.background;
      context.fillRect(0, 0, canvasSize, canvasSize);
      context.fillStyle = qrCodePrintOptions.foreground;

      matrix.forEach((row, rowIndex) => {
        row.forEach((isDark, columnIndex) => {
          if (isDark) {
            context.fillRect(
              offset + (columnIndex + quietZone) * moduleSize,
              offset + (rowIndex + quietZone) * moduleSize,
              moduleSize,
              moduleSize,
            );
          }
        });
      });

    } catch (error) {
      nextErrorMessage = error instanceof Error ? error.message : "Unable to generate QR code.";
    }

    const frameId = window.requestAnimationFrame(() => setErrorMessage(nextErrorMessage));

    return () => window.cancelAnimationFrame(frameId);
  }, [absoluteUrl]);

  function downloadQrCode(format: "svg" | "png") {
    if (format === "svg") {
      const blob = new Blob([createQrSvg(absoluteUrl)], { type: "image/svg+xml;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = getDownloadFileName(fileName, "svg");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = getDownloadFileName(fileName, "png");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    }, "image/png", 1);
  }

  return (
    <section className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div>
        <h2 className="text-lg font-black text-gray-950 dark:text-white">{title}</h2>
        <p className="mt-1 break-all text-xs font-bold text-gray-500 dark:text-gray-300">{absoluteUrl}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {svgPreview ? (
          <div
            role="img"
            aria-label={title}
            className="h-40 w-40 rounded-md border border-gray-100 bg-white p-2 dark:border-white/10 [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svgPreview }}
          />
        ) : null}
        <canvas ref={canvasRef} aria-hidden="true" className="hidden" />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadQrCode("svg")}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-gray-950 px-4 text-sm font-black text-white transition hover:bg-orange-500 dark:bg-white dark:text-gray-950 dark:hover:bg-orange-300"
          >
            {downloadLabel} SVG
          </button>
          <button
            type="button"
            onClick={() => downloadQrCode("png")}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-200 px-4 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100"
          >
            PNG HD
          </button>
        </div>
      </div>
      {errorMessage ? (
        <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}

function getDownloadFileName(fileName: string, extension: "svg" | "png") {
  return fileName.replace(/\.[^.]+$/, `.${extension}`);
}
