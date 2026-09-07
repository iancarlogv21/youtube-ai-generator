# Sprint 9: Cinematic video effects

The existing script, Gemini, Pexels, and scene-editing flow now exports videos with varied camera motion and crossfades.

## Try it

1. Start the backend from `backend`: `.venv\Scripts\python.exe -m uvicorn main:app --reload`.
2. Start the frontend from `frontend`: `npm run dev`.
3. Generate scenes and wait for all images, or use the existing scene editor.
4. In **Video Export**, choose **Landscape 16:9 (1280 x 720)** or **Shorts / TikTok 9:16 (1080 x 1920)**.
5. Click **Generate Video**. The status reports image downloads, scene rendering with the selected motion, and final assembly.
6. Play or download the finished MP4. Scene editing is disabled while rendering.

Images are center-cropped to fill the selected format, preserving their proportions. Portrait crops can exclude subjects near the edges of a landscape photo. Choose a different photo if the crop misses the subject.

## Rendering behavior

- Each group of four scenes gets a shuffled selection of zoom in, zoom out, pan left, and pan right. Adjacent effects never repeat, including across groups.
- Motion eases at both ends and spans the full scene duration. Zoom changes between 1.0 and 1.25; pans use 1.25 zoom to provide room for travel.
- Outputs use H.264, 30 fps, square pixels, and yuv420p. The MP4 metadata is moved to the beginning for browser playback.
- Crossfades overlap adjacent clips by up to 0.5 seconds, capped at half either clip's duration. Timing is calculated in frames. Total duration is the sum of rounded scene durations minus those overlaps.
- The first and last edges fade to/from black. A single scene also receives these fades.
- Progress measures completed rendering steps, not elapsed time. It can stay at the same percentage while a long scene or the final assembly is processing.

No additional packages or paid generation services were added. These effects move a virtual camera across still images. Narration, subtitles, music, and image-to-video animation remain later sprints.

## API

The original `POST /api/videos/generate` remains synchronous and returns `{"video_url": "..."}`. Its old scenes-only request still works with landscape output by default.

Both that endpoint and the new `POST /api/videos/jobs` accept:

```json
{
  "aspect_ratio": "9:16",
  "scenes": [
    {
      "image_url": "https://images.pexels.com/photos/31393431/pexels-photo-31393431.jpeg",
      "duration": 5
    }
  ]
}
```

Requests allow 1-50 scenes, each lasting 0.1-120 seconds. Invalid durations and formats return HTTP 422.

The jobs endpoint returns HTTP 202 with `job_id`, `status`, `progress`, and `message`. Poll `GET /api/videos/jobs/{job_id}` for `queued`, `rendering`, `completed`, or `failed`. Completion includes `video_url`; failure includes `error`.

Only one render runs at a time in this local server; another render request returns HTTP 409. Progress history is held in memory for the latest 100 jobs. Run a single Uvicorn worker. Restarting/reloading the backend clears history and can interrupt rendering. Closing the page stops browser polling but does not cancel the backend render. Persistent jobs and cancellation are future infrastructure work.

Generated videos stay in `backend/generated_videos`; per-job temporary images and clips are cleaned up after completion or failure. Generated files and temporary files are ignored by Git.

## Files

- `backend/services/video_service.py`: motion, crop, crossfades, fades, and progress callbacks.
- `backend/schemas/video.py`: format and duration validation, job response.
- `backend/routers/videos.py`: synchronous compatibility, background jobs, and status polling.
- `frontend/src/services/videoApi.ts`: job submission, polling, error handling, and abort cleanup.
- `frontend/src/pages/Dashboard.tsx`: format selector, progress, preview sizing, and stale-result protection.

## Verification

From `backend`:

```powershell
.venv\Scripts\python.exe -B -m unittest discover -s tests -v
```

The integration tests use local synthetic images and real FFmpeg/ffprobe to check motion direction, geometry, movement late in long scenes, transition pixels, duration, output dimensions, and fades. They do not call Gemini or Pexels.

From `frontend`:

```powershell
npm run build
npm run lint
node --test tests/videoApi.test.mjs
```

The Node tests use mocked HTTP responses to verify job polling, payloads, errors, and abort behavior (Node 24 supports importing this TypeScript service directly).

FFmpeg filter reference: [zoompan](https://ffmpeg.org/ffmpeg-filters.html#zoompan), [xfade](https://ffmpeg.org/ffmpeg-filters.html#xfade), and [fade](https://ffmpeg.org/ffmpeg-filters.html#fade).

