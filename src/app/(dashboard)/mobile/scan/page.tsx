"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Scan, Camera, Type } from "lucide-react";

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect: (img: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

export default function MobileScanPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMode("camera");
    } catch (e) {
      setError("Camera access denied. Use manual entry.");
      setMode("manual");
    }
  }

  async function captureAndDetect() {
    if (!videoRef.current || !window.BarcodeDetector) {
      setError("BarcodeDetector API not available. Use manual entry.");
      return;
    }
    try {
      const detector = new window.BarcodeDetector({
        formats: ["qr_code", "ean_13", "code_128", "code_39"],
      });
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0);
      const bitmap = await createImageBitmap(canvas);
      const results = await detector.detect(bitmap);
      if (results.length > 0) {
        handleScanResult(results[0].rawValue);
      }
    } catch {
      setError("Scan failed. Try manual entry.");
    }
  }

  function handleScanResult(value: string) {
    router.push(`/assets?q=${encodeURIComponent(value)}`);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScanResult(manualCode.trim());
    } else {
      setError("Enter an asset tag");
    }
  }

  const hasBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <h1 className="text-xl font-semibold mb-6">Scan Asset</h1>

      {mode === "camera" && videoRef && (
        <div className="w-full max-w-md mb-6">
          <div className="relative rounded-lg overflow-hidden border-2 border-[var(--border)] bg-black aspect-square">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          {hasBarcodeDetector && (
            <Button
              className="w-full mt-4"
              onClick={captureAndDetect}
            >
              <Scan className="h-4 w-4 mr-2" />
              Scan Now
            </Button>
          )}
          <Button
            variant="secondary"
            className="w-full mt-2"
            onClick={() => {
              streamRef.current?.getTracks().forEach((t) => t.stop());
              setMode("manual");
            }}
          >
            Switch to Manual Entry
          </Button>
        </div>
      )}

      {mode === "manual" && (
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Asset tag or barcode
                </label>
                <Input
                  placeholder="TAG-00001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-sm text-[var(--error)]" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full">
                <Type className="h-4 w-4 mr-2" />
                Look Up Asset
              </Button>
            </form>
            {hasBarcodeDetector && (
              <Button
                variant="secondary"
                className="w-full mt-4"
                onClick={startCamera}
              >
                <Camera className="h-4 w-4 mr-2" />
                Use Camera
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <p className="mt-6 text-xs text-[var(--text-muted)] text-center">
        {!hasBarcodeDetector &&
          "BarcodeDetector API not supported in this browser. Use manual entry."}
      </p>
    </div>
  );
}
