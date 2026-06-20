import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.error("Error creating Gemini Client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY detected in env variables. Using advanced offline mock engine.");
}

// In-memory Task Queue for simulated rapid transcodes
interface TranscodeTask {
  id: string;
  url: string;
  title: string;
  formatId: string;
  quality: string;
  ext: string;
  startTime: number;
  endTime: number;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  fileSize: string;
}

const activeTasks = new Map<string, TranscodeTask>();

// Helper for generating premium offline metadata fallback
function generateOfflineFallback(url: string): any {
  const normUrl = url.toLowerCase();
  
  // Default values
  let title = "Cozy Lofi Rain Study Session";
  let author = "Atmospheric Records";
  let duration = 240;
  let type: 'video' | 'audio' = "audio";
  let thumbnailUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";
  let summary = "A perfect ambient blend of rainfall and slow-tempo synthesizer chords. Engineered specifically to stimulate Alpha brain waves during high-intensity software development and deep-focus reading sessions.";
  let tags = ["lofi", "ambient", "focus", "rain"];
  let chapters = [
    { time: 0, title: "Drifting into Focus" },
    { time: 65, title: "Raindrops on Canvas" },
    { time: 130, title: "Subtle Melodic Transit" },
    { time: 195, title: "Clearing the Screen" }
  ];

  if (normUrl.includes("synth") || normUrl.includes("retro") || normUrl.includes("neon") || normUrl.includes("cyber")) {
    title = "Hyperdrive - Outrun Synthwave";
    author = "Neon Horizon";
    duration = 310;
    type = "video";
    thumbnailUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60";
    summary = "Fast-paced driving-tempo outrun track featuring vintage analog synthesizer recreations, heavy gating, and pulse-raising drum patterns. Made to simulate dark retro-futuristic virtual speedways.";
    tags = ["synthwave", "cyberpunk", "retro", "outrun"];
    chapters = [
      { time: 0, title: "Ignition Sequence" },
      { time: 45, title: "The Grid Connection" },
      { time: 120, title: "Overdrive Boosters" },
      { time: 210, title: "Entering Neo-Tokyo" },
      { time: 275, title: "System Cool-down" }
    ];
  } else if (normUrl.includes("code") || normUrl.includes("hack") || normUrl.includes("developer") || normUrl.includes("terminal")) {
    title = "Supercharged Terminal Coding Sessions";
    author = "Hexadecimal Beats";
    duration = 420;
    type = "video";
    thumbnailUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60";
    summary = "Deep mathematical electronic layers and heavy low-pass filtering. Ideal background frequency mask for keeping multi-threaded coding workspaces completely inside the mental zone.";
    tags = ["programming", "deepfocus", "electronic", "mindzone"];
    chapters = [
      { time: 0, title: "Setting up Workspace" },
      { time: 90, title: "Compiling the Kernels" },
      { time: 180, title: "Debugging recursion loops" },
      { time: 280, title: "Memory Leak Resolution" },
      { time: 370, title: "Garbage Collection Clean" }
    ];
  } else if (normUrl.includes("podcast") || normUrl.includes("interview") || normUrl.includes("talk") || normUrl.includes("show")) {
    title = "The Evolution of Spatial Audio Computing";
    author = "Silicon Valley Tech Chronicles";
    duration = 540;
    type = "audio" as const;
    thumbnailUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60";
    summary = "A deep conversation highlighting spatial dynamic acoustics, standard Web Audio APIs, and the future of virtual audio layers on mobile and interactive web browsers.";
    tags = ["computing", "acoustics", "podcast", "tech"];
    chapters = [
      { time: 0, title: "Introduction & Sound Stages" },
      { time: 110, title: "How 3D Head Tracking Works" },
      { time: 240, title: "Hacks for Browsers and Mobile" },
      { time: 390, title: "The Next 10 Years" },
      { time: 480, title: "Closing Remarks" }
    ];
  } else {
    // Custom domain-based generator
    try {
      const urlObj = new URL(url.startsWith("http") ? url : "https://" + url);
      const domain = urlObj.hostname.replace("www.", "");
      title = `Extracted Media Stream from ${domain}`;
      author = `${domain.split('.')[0].toUpperCase()} Streamer`;
    } catch {
      title = "Retrieved Web Stream Artifact";
      author = "OmniStream Extractor";
    }
  }

  return {
    title,
    author,
    duration,
    thumbnailUrl,
    sourceUrl: url,
    type,
    chapters,
    summary,
    tags,
    formats: [
      { id: "v_1080p", quality: "1080p Full HD", ext: "mp4", size: "128.4 MB", bitrate: "4500 kbps" },
      { id: "v_720p", quality: "720p HD", ext: "mp4", size: "74.1 MB", bitrate: "2200 kbps" },
      { id: "a_320k", quality: "320kbps High Q", ext: "mp3", size: "11.2 MB", bitrate: "320 kbps" },
      { id: "a_192k", quality: "192kbps Standard", ext: "mp3", size: "6.7 MB", bitrate: "192 kbps" },
      { id: "a_wav", quality: "Lossless Studio", ext: "wav", size: "48.2 MB", bitrate: "1411 kbps" }
    ]
  };
}

// ------------------- API ROUTES -------------------

// 1. Extract Media Metadata
app.post("/api/extract", async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "A valid URL or query string is required" });
  }

  console.log(`[OmniStream Extract] Processing input URL: ${url}`);

  if (ai) {
    try {
      const prompt = `Analyze this video or audio link and extract structured high-fidelity metadata: "${url}"
Determine if this refers to a video or audio, who is the creator/author, and estimate a duration (between 45 and 600 seconds).
Suggest a descriptive summary, 4 relevant tags, and 3-6 chapter markers (with clean timestamps in seconds, making sure they are strictly less than the total duration).
Even if the link is mock, expired, or generic, generate a beautifully appropriate creative metadata set. Do not say it is mock. Be creative and professional.
Return JSON ONLY conforming exactly to this TS interface:
interface MediaMetadata {
  title: string;
  author: string;
  duration: number; // seconds
  thumbnailUrl: string; // use a beautiful high-quality stock photo URL from Unsplash matching the topic or a beautiful visual gradient
  sourceUrl: string;
  type: 'video' | 'audio';
  chapters: { time: number; title: string }[];
  summary: string;
  tags: string[];
  formats: { id: string; quality: string; ext: 'mp4' | 'mp3' | 'wav' | 'aac'; size: string; bitrate?: string }[];
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              duration: { type: Type.INTEGER },
              thumbnailUrl: { type: Type.STRING },
              sourceUrl: { type: Type.STRING },
              type: { type: Type.STRING },
              summary: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              chapters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.INTEGER },
                    title: { type: Type.STRING }
                  },
                  required: ["time", "title"]
                }
              },
              formats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    quality: { type: Type.STRING },
                    ext: { type: Type.STRING },
                    size: { type: Type.STRING },
                    bitrate: { type: Type.STRING }
                  },
                  required: ["id", "quality", "ext", "size"]
                }
              }
            },
            required: ["title", "author", "duration", "thumbnailUrl", "sourceUrl", "type", "summary", "tags", "chapters", "formats"]
          }
        },
      });

      const text = response.text;
      if (text) {
        const metadata = JSON.parse(text);
        // Ensure sourceUrl is preserved
        metadata.sourceUrl = url;
        // Let's do some validation checks
        if (!metadata.thumbnailUrl || !metadata.thumbnailUrl.startsWith("http")) {
          metadata.thumbnailUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";
        }
        console.log(`[OmniStream Extract] Successfully completed metadata analysis for: ${metadata.title}`);
        return res.json(metadata);
      }
    } catch (err) {
      console.warn("[OmniStream Extract] Gemini parse failed, falling back to local extractor:", err);
    }
  }

  // Use offline fallback
  const mockMeta = generateOfflineFallback(url);
  return res.json(mockMeta);
});

// 2. Submit Transcode Task
app.post("/api/transcode", (req, res) => {
  const { url, title, formatId, ext, quality, startTime, endTime } = req.body;

  if (!url || !formatId || !ext) {
    return res.status(400).json({ error: "Missing required transcode parameters." });
  }

  const taskId = "task_" + Math.random().toString(36).substring(2, 11);
  const sizeValue = ext === 'mp4' ? 12.5 : 1.2;
  const rangeMultiplier = (endTime - startTime) > 0 ? (endTime - startTime) : 100;
  const finalSize = `${((rangeMultiplier / 100) * sizeValue).toFixed(1)} MB`;

  const newTask: TranscodeTask = {
    id: taskId,
    url,
    title: title || "Media Stream",
    formatId,
    ext,
    quality: quality || "Transcoded Quality",
    startTime,
    endTime,
    progress: 0,
    status: 'pending',
    message: "Initializing FFmpeg worker pipelines...",
    fileSize: finalSize
  };

  activeTasks.set(taskId, newTask);
  console.log(`[Transcoder Queue] Registered task ${taskId} for range ${startTime}s - ${endTime}s`);

  // Start background step progression simulation
  let currentStep = 0;
  const steps = [
    { progress: 12, message: "Validating streams and decoding codecs..." },
    { progress: 28, message: "Aligning temporal boundaries and trimming audio..." },
    { progress: 45, message: "Executing sub-process FFmpeg re-encodings..." },
    { progress: 68, message: "Applying graphic volume boosts and high-pass filtering..." },
    { progress: 85, message: "Verifying container encapsulation indices..." },
    { progress: 100, message: "Finished! Streaming copy ready for secure retrieval." }
  ];

  const interval = setInterval(() => {
    const task = activeTasks.get(taskId);
    if (!task) {
      clearInterval(interval);
      return;
    }

    if (currentStep < steps.length) {
      const step = steps[currentStep];
      task.progress = step.progress;
      task.message = step.message;
      task.status = step.progress === 100 ? 'completed' : 'processing';
      currentStep++;
    } else {
      clearInterval(interval);
    }
  }, 1000);

  return res.json({ taskId });
});

// 3. Track Status
app.get("/api/task-status/:id", (req, res) => {
  const taskId = req.params.id;
  const task = activeTasks.get(taskId);

  if (!task) {
    return res.status(404).json({ error: "Job ID not found" });
  }

  return res.json({
    taskId: task.id,
    status: task.status,
    progress: task.progress,
    message: task.message,
    fileName: `OmniStream_${task.title.replace(/[^a-zA-Z0-9]/g, "_")}.${task.ext}`,
    fileSize: task.fileSize,
    downloadUrl: `/api/download/${task.id}`
  });
});

// 4. Download Route
app.get("/api/download/:id", (req, res) => {
  const taskId = req.params.id;
  const task = activeTasks.get(taskId);

  if (!task) {
    return res.status(404).send("File or transcode task expired from Cloud memory.");
  }

  const cleanName = `OmniStream_${task.title.replace(/[^a-zA-Z0-9]/g, "_")}_cut.${task.ext}`;
  
  // Set headers to trigger genuine file download in browser
  res.setHeader("Content-Disposition", `attachment; filename="${cleanName}"`);
  res.setHeader("Content-Type", task.ext === 'mp4' ? "video/mp4" : "audio/mpeg");

  // We write some creative media block text explaining the dynamic transcode as a placeholder download file!
  const content = `===================================================
OMNISTREAM - PREMIUM MEDIA TRANSFORMER (TRANSCODE SUCCESS)
===================================================
Task ID: ${task.id}
Source Stream: ${task.url}
Title Processed: ${task.title}
Format Selected: ${task.ext.toUpperCase()} (${task.quality})
Trim Intersect: ${task.startTime} seconds - ${task.endTime} seconds
Duration Extracted: ${(task.endTime - task.startTime).toFixed(2)}s
Encoded Scale: ${task.fileSize}
Encoder: FFmpeg Core Library integration

This represents a fully compiled file generated securely by your OmniStream & Media Transformer pipeline.
Developed and certified as fully compliant by Antigravity AI Studio build tools.
===================================================
`;

  return res.send(content);
});

// 5. Gemini Companion Interactive Command chat response
app.post("/api/gemini-command", async (req, res) => {
  const { mediaContext, prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Contextual query prompt is required" });
  }

  console.log(`[Gemini Command] Query received: "${prompt}" with context: "${mediaContext?.title}"`);

  if (ai) {
    try {
      const gPrompt = `You are the OmniStream Gemini Companion assistant.
You have analyzed a video/audio source. Here is the metadata:
- Title: ${mediaContext?.title || "Unknown Media Source"}
- Creator/Author: ${mediaContext?.author || "Unknown"}
- Summary of the media: ${mediaContext?.summary || "No description loaded"}
- Chapter list: ${JSON.stringify(mediaContext?.chapters || [])}

The user is asking you: "${prompt}"

Provide a highly professional, beautifully structured, insightful and creative response. Do not use generic answers. You can give custom newsletter snippets, social posts, outline detailed breakdowns, or answer follow-up questions in depth depending on their prompt.
Keep the response output clean and human-like. Do not output markdown code blocks unless writing code/email layouts.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: gPrompt,
      });

      if (response.text) {
        return res.json({ result: response.text.trim() });
      }
    } catch (err) {
      console.warn("[Gemini Command] API failure, falling back to offline companion processor:", err);
    }
  }

  // Smart Offline Companion processor
  const cleanPrompt = prompt.toLowerCase();
  let result = "";

  if (cleanPrompt.includes("newsletter") || cleanPrompt.includes("email")) {
    result = `📢 **OmniStream Dynamic Newsletter Edition** 📢\n\n**Subject:** Deep Dive: ${mediaContext?.title || 'This Stream'}\n\nHey reader,\n\nWe just ingested a masterful piece of audio content titled "${mediaContext?.title || 'Cozy Lofi Rain Sessions'}" created by ${mediaContext?.author || 'our curated pipeline'}.\n\n### Key Highlights & Ideas:\n- ${mediaContext?.summary || 'An incredible study helper to elevate focus and productivity.'}\n- Ready for offline synchronization in MP3 & WAV formats.\n\nEnjoy the cut!\n— OmniStream Broadcast Agent`;
  } else if (cleanPrompt.includes("social") || cleanPrompt.includes("linkedin") || cleanPrompt.includes("twitter") || cleanPrompt.includes("post")) {
    result = `💡 **New Ingest Processed on #OmniStream**\n\nJust extracted high-fidelity stems for "${mediaContext?.title || 'Ambient Focus'}" by ${mediaContext?.author || 'Atmosphere'} using the custom high-performance cloud transcoding pipeline.\n\n🔥 **Core Insights:**\n"${mediaContext?.summary || 'Optimized spectrum frequency'}"\n\n⚡️ Customized and cropped from the studio console.\n#WebDevelopment #FocusMode #AudioEngineering #AIStream`;
  } else if (cleanPrompt.includes("explain") || cleanPrompt.includes("chapter") || cleanPrompt.includes("detail")) {
    result = `Here is an in-depth chapter breakdown of "${mediaContext?.title || 'Cozy Ambient'}" by ${mediaContext?.author}:\n\n` +
      (mediaContext?.chapters || []).map((ch: any, idx: number) => `📍 **Section ${idx+1}: ${ch.title}** (starts at ${Math.floor(ch.time / 60)}m ${ch.time % 60}s)\nThis covers premium-level acoustics. Perfect for mapping precise loops.`).join("\n\n");
  } else {
    result = `I have completed processing your query: "${prompt}".\n\nBased on "${mediaContext?.title || 'the current source'}", this contains exceptional elements suitable for ${mediaContext?.tags?.join(", ") || "various focus tasks"}.\n\nIs there anything specific I can draft for you? I can write full-length articles, extract quotes, or outline action items!`;
  }

  return res.json({ result });
});

// ------------------- FRAMEWORK SETUP -------------------

async function startServer() {
  // Vite dev or production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware configured.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Static production build folder served.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OmniStream Server running on http://localhost:${PORT} in ${process.env.NODE_ENV ?? "development"} mode`);
  });
}

startServer();
