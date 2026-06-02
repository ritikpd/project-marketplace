---
name: Object Storage Setup
description: How object storage (GCS presigned URLs) is wired in NEPZIA — patterns, gotchas, and serving convention.
---

## Pattern

Two-step presigned URL upload flow:
1. `POST /api/storage/uploads/request-url` — send `{name, size, contentType}`, get `{uploadURL, objectPath}`
2. `PUT uploadURL` directly to GCS with `Content-Type` header

Objects are stored under `/objects/uploads/<uuid>` (the `objectPath`).

## Serving images

To display a stored image, prepend `/api/storage` to the objectPath:
```
src={`/api/storage${objectPath}`}   // e.g. /api/storage/objects/uploads/some-uuid
```

Old HTTP URLs in the DB pass through unchanged (backwards compat guard: `path.startsWith("/objects/") ? ...`).

## Key files

- `artifacts/api-server/src/lib/objectStorage.ts` — `ObjectStorageService` (copied from skill template)
- `artifacts/api-server/src/lib/objectAcl.ts` — `ObjectPermission` enum
- `artifacts/api-server/src/routes/storage.ts` — `POST /storage/uploads/request-url` + `GET /storage/objects/:path`
- `artifacts/nepzia/src/components/ImageUploader.tsx` — custom drag-and-drop uploader (no Uppy)

## ImageUploader props

```typescript
onChange: Dispatch<SetStateAction<UploadedImage[]>>  // must be React's setState shape — functional updaters used internally
```

Pass `setImages` directly from `useState<UploadedImage[]>`.

## Why no Uppy

Built a custom uploader for full OLX-style UX control (cover badge, drag-to-reorder, per-image XHR progress). The `lib/object-storage-web` Uppy lib was NOT wired in — skip it.

## Gotcha: objectStorage.ts response.json() type

`response.json()` returns `unknown` — must cast: `const json = (await response.json()) as { signed_url: string }`.
