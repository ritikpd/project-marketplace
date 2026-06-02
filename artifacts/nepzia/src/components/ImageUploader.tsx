import { useRef, useState, useCallback, DragEvent, type Dispatch, type SetStateAction } from "react";
import { Upload, X, ImagePlus, GripVertical, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGES = 10;
const MAX_SIZE_MB = 15;

export interface UploadedImage {
  objectPath: string;
  previewUrl: string;
  name: string;
  uploading?: boolean;
  error?: string;
  progress?: number;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: Dispatch<SetStateAction<UploadedImage[]>>;
  disabled?: boolean;
}

async function requestPresignedUrl(file: File): Promise<{ uploadURL: string; objectPath: string }> {
  const res = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Failed to get upload URL");
  }
  return res.json();
}

async function uploadToGCS(file: File, uploadURL: string, onProgress?: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadURL);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("Upload failed"));
    });
    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.send(file);
  });
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Only JPG, PNG, and WebP images are supported";
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Image must be under ${MAX_SIZE_MB}MB`;
  return null;
}

export function ImageUploader({ images, onChange, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const processFiles = useCallback(async (files: File[]) => {
    const remaining = MAX_IMAGES - images.filter(i => !i.error).length;
    const toProcess = files.slice(0, remaining);

    const validFiles: { file: File; preview: string }[] = [];
    for (const file of toProcess) {
      const err = validateFile(file);
      if (err) {
        const preview = URL.createObjectURL(file);
        onChange([...images, { objectPath: "", previewUrl: preview, name: file.name, error: err }]);
        continue;
      }
      validFiles.push({ file, preview: URL.createObjectURL(file) });
    }

    if (validFiles.length === 0) return;

    const pendingEntries: UploadedImage[] = validFiles.map(({ file, preview }) => ({
      objectPath: "",
      previewUrl: preview,
      name: file.name,
      uploading: true,
      progress: 0,
    }));

    onChange(prev => [...prev, ...pendingEntries]);

    for (let i = 0; i < validFiles.length; i++) {
      const { file, preview } = validFiles[i];
      const startIdx = images.filter(x => !x.error).length + i;

      try {
        const { uploadURL, objectPath } = await requestPresignedUrl(file);
        await uploadToGCS(file, uploadURL, (progress) => {
          onChange(prev => {
            const next = [...prev];
            const idx = next.findIndex(x => x.previewUrl === preview);
            if (idx !== -1) next[idx] = { ...next[idx], progress };
            return next;
          });
        });
        onChange(prev => {
          const next = [...prev];
          const idx = next.findIndex(x => x.previewUrl === preview);
          if (idx !== -1) next[idx] = { objectPath, previewUrl: preview, name: file.name, uploading: false, progress: 100 };
          return next;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        onChange(prev => {
          const next = [...prev];
          const idx = next.findIndex(x => x.previewUrl === preview);
          if (idx !== -1) next[idx] = { objectPath: "", previewUrl: preview, name: file.name, uploading: false, error: msg };
          return next;
        });
      }
    }
  }, [images, onChange]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    processFiles(arr);
  }, [processFiles]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const removeImage = useCallback((idx: number) => {
    const img = images[idx];
    if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    onChange(images.filter((_, i) => i !== idx));
  }, [images, onChange]);

  const retryImage = useCallback(async (idx: number) => {
    const img = images[idx];
    const file = await fetch(img.previewUrl).then(r => r.blob()).then(b => new File([b], img.name, { type: b.type }));
    const next = [...images];
    next[idx] = { ...img, uploading: true, error: undefined, progress: 0 };
    onChange(next);

    try {
      const { uploadURL, objectPath } = await requestPresignedUrl(file);
      await uploadToGCS(file, uploadURL, (progress) => {
        onChange(prev => {
          const n = [...prev];
          n[idx] = { ...n[idx], progress };
          return n;
        });
      });
      onChange(prev => {
        const n = [...prev];
        n[idx] = { objectPath, previewUrl: img.previewUrl, name: img.name, uploading: false, progress: 100 };
        return n;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      onChange(prev => {
        const n = [...prev];
        n[idx] = { ...n[idx], uploading: false, error: msg };
        return n;
      });
    }
  }, [images, onChange]);

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragEnd = () => { setDraggedIdx(null); setDragOverIdx(null); };
  const handleDragEnterThumb = (idx: number) => setDragOverIdx(idx);

  const handleDropThumb = useCallback((e: DragEvent<HTMLDivElement>, targetIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const next = [...images];
    const [moved] = next.splice(draggedIdx, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
    setDraggedIdx(null);
    setDragOverIdx(null);
  }, [draggedIdx, images, onChange]);

  const canAddMore = images.filter(i => !i.error).length < MAX_IMAGES;
  const hasImages = images.length > 0;

  return (
    <div className="space-y-4">
      {!hasImages ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
            ${dragOver ? "border-primary bg-primary/10 scale-[1.01]" : "border-white/10 hover:border-primary/50 hover:bg-white/[0.02]"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ImagePlus className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Upload Photos</p>
            <p className="text-muted-foreground text-sm mt-1">Drag & drop or click to browse</p>
            <p className="text-muted-foreground text-xs mt-1">JPG, PNG, WebP · Up to {MAX_SIZE_MB}MB each · Max {MAX_IMAGES} photos</p>
          </div>
          <Button
            type="button"
            disabled={disabled}
            className="mt-1 bg-primary hover:bg-primary/90 text-white rounded-xl px-6"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Photos
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <div
                key={img.previewUrl}
                draggable={!img.uploading && !img.error}
                onDragStart={() => handleDragStart(idx)}
                onDragEnd={handleDragEnd}
                onDragEnter={() => handleDragEnterThumb(idx)}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => handleDropThumb(e, idx)}
                className={`
                  relative group aspect-square rounded-xl overflow-hidden border transition-all
                  ${dragOverIdx === idx && draggedIdx !== idx ? "border-primary scale-105 ring-2 ring-primary/50" : "border-white/10"}
                  ${idx === 0 ? "col-span-2 row-span-2 rounded-2xl" : ""}
                  ${draggedIdx === idx ? "opacity-40 scale-95" : ""}
                `}
              >
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />

                {idx === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    COVER
                  </div>
                )}

                {!img.uploading && !img.error && (
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      type="button"
                      title="Drag to reorder"
                      className="w-6 h-6 bg-black/70 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="w-3 h-3 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="w-6 h-6 bg-black/70 hover:bg-red-500/90 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {img.uploading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                    <div className="w-3/4 bg-white/20 rounded-full h-1">
                      <div
                        className="bg-primary h-1 rounded-full transition-all duration-300"
                        style={{ width: `${img.progress ?? 0}%` }}
                      />
                    </div>
                    <span className="text-white text-[10px]">{img.progress ?? 0}%</span>
                  </div>
                )}

                {img.error && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 p-1">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-300 text-[9px] text-center leading-tight">{img.error}</p>
                    <button
                      type="button"
                      onClick={() => retryImage(idx)}
                      className="text-[9px] text-primary underline"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!img.uploading && !img.error && img.objectPath && (
                  <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-md" />
                  </div>
                )}
              </div>
            ))}

            {canAddMore && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setDragOver(false)}
                onClick={() => !disabled && inputRef.current?.click()}
                className={`
                  aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all
                  ${dragOver ? "border-primary bg-primary/10" : "border-white/10 hover:border-primary/50 hover:bg-white/[0.03]"}
                  ${images.length === 0 ? "col-span-2 row-span-2" : ""}
                `}
              >
                <ImagePlus className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">Add more</span>
                <span className="text-muted-foreground/60 text-[10px]">{images.filter(i => !i.error).length}/{MAX_IMAGES}</span>
              </div>
            )}
          </div>

          <p className="text-muted-foreground text-xs">
            Drag thumbnails to reorder · First photo is the cover image · {images.filter(i => !i.error).length}/{MAX_IMAGES} photos
          </p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
      />
    </div>
  );
}
