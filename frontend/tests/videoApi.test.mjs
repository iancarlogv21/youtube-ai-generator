import assert from "node:assert/strict";
import test from "node:test";
import { generateVideo } from "../src/services/videoApi.ts";

const scenes = [{ image_url: "https://images.example/scene.jpg", duration: 3 }];
const videoUrl = "http://127.0.0.1:8000/generated_videos/movie.mp4";

function job(status, overrides = {}) {
  return {
    job_id: "job/one",
    status,
    progress: status === "completed" ? 100 : 0,
    message: status,
    video_url: status === "completed" ? videoUrl : null,
    error: null,
    ...overrides,
  };
}

function mockResponses(t, responses) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    assert.ok(calls.length <= responses.length, "Unexpected extra fetch");
    return responses[calls.length - 1];
  });
  t.after(() => assert.equal(calls.length, responses.length, "All expected requests ran"));
  return calls;
}

for (const aspectRatio of [undefined, "9:16"]) {
  test(`submits scenes with ${aspectRatio ?? "default 16:9"} output`, async (t) => {
    const calls = mockResponses(t, [Response.json(job("completed"))]);

    assert.deepEqual(await generateVideo(scenes, { aspectRatio }), { video_url: videoUrl });
    assert.equal(calls[0].url, "http://127.0.0.1:8000/api/videos/jobs");
    assert.equal(calls[0].options.method, "POST");
    assert.equal(calls[0].options.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      scenes,
      aspect_ratio: aspectRatio ?? "16:9",
    });
  });
}

test("polls queued and rendering jobs, reports progress, and returns the completed URL", async (t) => {
  const jobs = [job("queued"), job("rendering", { progress: 45 }), job("completed")];
  const controller = new AbortController();
  const calls = mockResponses(t, jobs.map((value) => Response.json(value)));
  const progress = [];

  const result = await generateVideo(scenes, {
    signal: controller.signal,
    onProgress: (value) => progress.push(value),
  });

  assert.deepEqual(result, { video_url: videoUrl });
  assert.deepEqual(progress, jobs);
  assert.deepEqual(calls.slice(1).map((call) => call.url), [
    "http://127.0.0.1:8000/api/videos/jobs/job%2Fone",
    "http://127.0.0.1:8000/api/videos/jobs/job%2Fone",
  ]);
  for (const call of calls) assert.equal(call.options.signal, controller.signal);
});

test("surfaces validation messages from FastAPI detail arrays", async (t) => {
  mockResponses(t, [Response.json({
    detail: [{ msg: "Invalid aspect ratio." }, { msg: "Scene duration is too short." }],
  }, { status: 422 })]);

  await assert.rejects(generateVideo(scenes), {
    message: "Invalid aspect ratio. Scene duration is too short.",
  });
});

test("rejects a failed render with its server error and reports final progress", async (t) => {
  const failed = job("failed", { error: "FFmpeg could not render this scene." });
  mockResponses(t, [Response.json(failed)]);
  const progress = [];

  await assert.rejects(generateVideo(scenes, { onProgress: (value) => progress.push(value) }), {
    message: failed.error,
  });
  assert.deepEqual(progress, [failed]);
});

test("aborting while waiting rejects and prevents another fetch", async (t) => {
  const controller = new AbortController();
  const calls = mockResponses(t, [Response.json(job("queued"))]);
  let abortTimer;
  t.after(() => clearTimeout(abortTimer));

  const result = generateVideo(scenes, {
    signal: controller.signal,
    onProgress: () => { abortTimer = setTimeout(() => controller.abort(), 10); },
  });

  await assert.rejects(result, { name: "AbortError" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.signal, controller.signal);
});

test("rejects a completed job without a video URL", async (t) => {
  mockResponses(t, [Response.json(job("completed", { video_url: null }))]);

  await assert.rejects(generateVideo(scenes), {
    message: "The completed render did not return a video URL.",
  });
});
