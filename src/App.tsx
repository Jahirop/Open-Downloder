import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Link as LinkIcon,
  Activity,
  Flame,
  ChevronRight,
  Loader2,
  Check,
  Download,
  Terminal,
  Volume2,
  Trash2,
  Grid,
  TrendingUp,
  Sliders,
  Settings,
  HelpCircle,
  Clock,
  Briefcase
} from "lucide-react";
import { MediaMetadata, ConversionConfig, TranscodeStatus } from "./types";
import MediaPreview from "./components/MediaPreview";
import AiCompanion from "./components/AiCompanion";

export default function App() {
  // Input URL state
  const [urlInput, setUrlInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadStep, setLoadStep] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Extracted media states
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);

  // Conversion Config states
  const [selectedFormat, setSelectedFormat] = useState<string>("a_320k"); // Default standard audio
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(100);
  const [volumeBoost, setVolumeBoost] = useState<number>(1.0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [vocalIsolate, setVocalIsolate] = useState<boolean>(false);
  const [bassBoost, setBassBoost] = useState<boolean>(false);
  const [qualitySlider, setQualitySlider] = useState<number>(12); // in Mbps, or normal indicator

  // Pipeline Transcoding states
  const [transcodeTaskId, setTranscodeTaskId] = useState<string>("");
  const [transcodeStatus, setTranscodeStatus] = useState<TranscodeStatus | null>(null);
  const [isTranscoding, setIsTranscoding] = useState<boolean>(false);

  // Suggested pre-populated options for immediate testing
  const SUGGESTIONS = [
    { label: "Cozy Ambient Lofi", url: "https://www.youtube.com/watch?v=lofi-cozy-rain" },
    { label: "Synthwave Cyberpunk Grid", url: "https://soundcloud.com/synthwave-hyperdrive-3" },
    { label: "Future Space Podcast", url: "https://vimeo.com/71239921/spatial-engineering" }
  ];

  // Auto-init chapter bounds when metadata changes
  useEffect(() => {
    if (metadata) {
      setStartTime(0);
      setEndTime(metadata.duration);
    }
  }, [metadata]);

  // Extraction submit handler
  const handleExtract = async (urlToFetch: string) => {
    if (!urlToFetch.trim()) {
      setErrorMsg("Please provide a valid media link first.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);
    setLoadStep("Establishing handshake with Cloud target...");

    const steps = [
      "Accessing media extraction headers...",
      "Resolving standard anti-bot throttling structures...",
      "Pumping audio-wave descriptors into Gemini-3.5 cognitive index...",
      "Structuring response nodes and generating creative chapters..."
    ];

    let i = 0;
    const progressInterval = setInterval(() => {
      if (i < steps.length) {
        setLoadStep(steps[i]);
        i++;
      }
    }, 700);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToFetch }),
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const data: MediaMetadata = await response.json();
        setMetadata(data);
        setUrlInput(data.sourceUrl);
      } else {
        const errorData = await response.json();
        setErrorMsg(errorData.error || "The extraction pipeline timed out. Please try again.");
      }
    } catch (err) {
      clearInterval(progressInterval);
      setErrorMsg("Connection to server failed. Ensure your platform server is active.");
    } finally {
      setIsLoading(false);
      setLoadStep("");
    }
  };

  // Transcoding execution trigger
  const handleInitializePipeline = async () => {
    if (!metadata) return;

    setIsTranscoding(true);
    setTranscodeStatus(null);
    setErrorMsg("");

    const formatObj = metadata.formats.find(f => f.id === selectedFormat);
    if (!formatObj) return;

    try {
      const res = await fetch("/api/transcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: metadata.sourceUrl,
          title: metadata.title,
          formatId: selectedFormat,
          ext: formatObj.ext,
          quality: formatObj.quality,
          startTime,
          endTime,
        })
      });

      if (res.ok) {
        const { taskId } = await res.json();
        setTranscodeTaskId(taskId);
        // Start polling immediately
        pollTranscodeProgress(taskId);
      } else {
        setIsTranscoding(false);
        setErrorMsg("Failed to allocate transcoding engine resource.");
      }
    } catch (err) {
      setIsTranscoding(false);
      setErrorMsg("Network error trying to contact transcoding worker.");
    }
  };

  // Poll transcode progress
  const pollTranscodeProgress = (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/task-status/${taskId}`);
        if (statusRes.ok) {
          const statusData: TranscodeStatus = await statusRes.json();
          setTranscodeStatus(statusData);

          if (statusData.status === 'completed' || statusData.status === 'failed') {
            clearInterval(interval);
            setIsTranscoding(false);
          }
        } else {
          clearInterval(interval);
          setIsTranscoding(false);
          setErrorMsg("Transcoding state tracking lost.");
        }
      } catch {
        clearInterval(interval);
        setIsTranscoding(false);
      }
    }, 1000);
  };

  // Reset/Clear source
  const handleReset = () => {
    setMetadata(null);
    setUrlInput("");
    setTranscodeStatus(null);
    setTranscodeTaskId("");
    setErrorMsg("");
  };

  return (
    <div className="bg-[#09090B] text-[#FAFAFA] min-h-screen flex flex-col font-sans overflow-x-hidden antialiased selection:bg-indigo-500/30 selection:text-white">
      {/* 1. Header Navigation in Geometric Balance palette */}
      <nav className="h-16 border-b border-[#27272A] flex items-center justify-between px-6 md:px-8 bg-[#09090B]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#A855F7] flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-white">OmniStream</span>
        </div>

        <div className="flex items-center space-x-4 md:space-x-8 text-[11px] font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">
          <span className="text-[#FAFAFA] hidden sm:inline border-b border-indigo-500 pb-1 cursor-default">Engine Workspace</span>
          <span className="hover:text-[#FAFAFA] transition-colors cursor-pointer hidden sm:inline" onClick={() => metadata && handleReset()}>Library</span>
          <div className="h-8 w-px bg-[#27272A] hidden sm:block"></div>
          <div className="flex items-center space-x-2 bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-800/80">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px]">SYSTEM READY</span>
          </div>
        </div>
      </nav>

      {/* 2. Main content block dynamic routing based on state */}
      <div className="flex-1 flex flex-col">
        {!metadata ? (
          /* State 01 & State 02: Ingest Phase (The Void Dashboard) */
          <main className="flex-1 flex flex-col justify-center items-center py-16 px-4 max-w-4xl mx-auto w-full">
            <div className="w-full text-center space-y-6 mb-12">
              <div className="inline-flex items-center gap-2 bg-[#18181B] border border-[#27272A] px-4 py-2 rounded-full text-xs font-mono text-[#A1A1AA] hover:border-zinc-700 transition-colors">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>MULTIMEDIA TRANSFORMER PIPELINE FOR DEVS</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-white leading-tight">
                Ingest & Transcode <span className="font-semibold bg-gradient-to-r from-[#6366F1] via-[#8b5cf6] to-[#A855F7] bg-clip-text text-transparent">Any Media Link</span>
              </h1>
              <p className="text-sm md:text-base text-[#A1A1AA] max-w-xl mx-auto font-light leading-relaxed">
                Enter any video or audio stream web link below. Our high-velocity extractors will parsing metadata instantly and spin up serverless FFmpeg transcode configurations natively.
              </p>
            </div>

            {/* Ingestion Console Box with Glowing Traces and Geometric Precision */}
            <div className="w-full bg-[#18181B] border border-[#27272A] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              {isLoading && (
                /* Laser flow gradient bar along top border */
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#6366F1] to-transparent animate-pulse" />
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExtract(urlInput);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] font-bold block">
                    Source Link Intake
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-[#A1A1AA] flex items-center">
                      <LinkIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Paste YouTube, Vimeo, SoundCloud URLs here..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-[#09090B] border border-[#27272A] text-white text-sm rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-1 focus:ring-[#6366F1] disabled:opacity-40 font-mono tracking-tight"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-red-950/20 text-red-400 text-xs py-3 px-4 rounded-xl border border-red-900/30 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 animate-pulse" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <span className="text-[11px] font-mono text-[#A1A1AA] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    Extraction nodes status: <span className="text-green-500 font-bold">ONLINE</span>
                  </span>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 px-8 rounded-xl bg-[#FAFAFA] hover:bg-white text-[#09090B] font-bold uppercase tracking-[0.15em] text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-30 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                        <span>PROCESSING</span>
                      </>
                    ) : (
                      <>
                        <span>INITIALIZE ANALYTICS</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Loader step narration helper */}
              {isLoading && (
                <div className="mt-6 p-4 rounded-xl bg-zinc-950 border border-zinc-900 text-xs font-mono text-[#A1A1AA] flex items-center gap-3 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-[#A855F7]" />
                  <span>{loadStep}</span>
                </div>
              )}
            </div>

            {/* Suggested Streams Shortcuts for Testing */}
            <div className="w-full mt-8 max-w-lg">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] font-bold block text-center mb-3">
                No URL handy? Try custom sandbox presets
              </span>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setUrlInput(sug.url);
                      handleExtract(sug.url);
                    }}
                    disabled={isLoading}
                    className="flex items-center justify-between px-4 py-3 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-[#FAFAFA] text-xs font-medium rounded-xl transition-all hover:translate-x-1"
                  >
                    <span className="font-mono tracking-tight">{sug.label}</span>
                    <span className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                      LOAD <ChevronRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </main>
        ) : (
          /* State 03: Interactive Workspace Dashboard (The Canvas Layout) */
          <main className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 lg:p-8 gap-6 max-w-7xl mx-auto w-full">
            
            {/* LEFT AREA: Stream Preview, Audio Visual Wave & companion insights (2/3 width) */}
            <div className="flex-[1.4] flex flex-col gap-6">
              
              {/* Media Title Descriptor Header Card */}
              <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <img
                    src={metadata.thumbnailUrl}
                    alt="Thumbnail"
                    className="w-16 h-16 object-cover rounded-lg border border-[#27272A] flex-shrink-0 bg-zinc-800"
                  />
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.15em] font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
                      {metadata.type.toUpperCase()} CAPTURE
                    </span>
                    <h2 className="text-base md:text-lg font-bold text-white mt-1 leading-snug truncate max-w-[280px] sm:max-w-md">
                      {metadata.title}
                    </h2>
                    <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">Origin: {metadata.author}</p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-mono rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-[#A1A1AA] hover:text-white flex items-center gap-1.5 transition-colors self-start md:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>RESET INGEST</span>
                </button>
              </div>

              {/* Dynamic Interactive Video Player and Slider Canvas component */}
              <MediaPreview
                metadata={metadata}
                startTime={startTime}
                endTime={endTime}
                setStartTime={setStartTime}
                setEndTime={setEndTime}
                playbackSpeed={playbackSpeed}
                volumeBoost={volumeBoost}
              />

              {/* Auxiliary Gemini Companion integrated down below */}
              <AiCompanion
                metadata={metadata}
                onSetStartTime={setStartTime}
                onSetEndTime={setEndTime}
              />
            </div>

            {/* RIGHT AREA: Advanced Transcoding Pipeline Config Dashboard (1/3 width) */}
            <div className="flex-1 bg-[#18181B] border border-[#27272A] rounded-2xl p-6 md:p-8 flex flex-col space-y-6">
              
              {/* Header Label inside Right Panel */}
              <div className="border-b border-[#27272A] pb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] font-extrabold block">TRANSCODING CONSOLE</span>
                <p className="text-xs text-zinc-500 font-mono mt-1">Configure codecs, range, and sound envelopes</p>
              </div>

              {/* Static display of source URL for visual proof */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] font-bold block">ACTIVE STREAM HOST</label>
                <div className="bg-[#09090B] border border-[#27272A] p-3 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[#FAFAFA] truncate max-w-[210px] font-mono text-[11px]">{metadata.sourceUrl}</span>
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                </div>
              </div>

              {/* Selectable Output Profile Formats */}
              <div className="space-y-3.5">
                <label className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] font-bold block">OUTPUT STREAM DESIGNATION</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {metadata.formats.map((fmt) => {
                    const isSelected = selectedFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={`p-3 rounded-xl text-left text-xs transition-all relative overflow-hidden flex flex-col justify-between h-20 border ${
                          isSelected
                            ? "bg-gradient-to-br from-[#6366F1] to-[#A855F7] border-transparent text-white shadow-lg shadow-indigo-500/10"
                            : "bg-[#09090B] border-[#27272A] hover:bg-[#1f1f23] text-zinc-300"
                        }`}
                      >
                        <span className="font-extrabold text-[11px] uppercase tracking-wider block font-mono">{fmt.ext.toUpperCase()} Core</span>
                        <div>
                          <span className={`${isSelected ? 'text-indigo-100' : 'text-zinc-400'} font-medium block text-[11px] mt-1`}>{fmt.quality}</span>
                          <span className={`text-[9px] ${isSelected ? 'text-indigo-200' : 'text-zinc-500'} font-mono`}>{fmt.size}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bitrate & Quality fine-tuning */}
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] font-bold">BITRATE QUALITY TARGET</label>
                  <span className="text-[11px] font-mono text-white bg-zinc-950 px-2 py-0.5 border border-zinc-800 rounded">{qualitySlider} Mbps</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={2}
                    max={24}
                    step={2}
                    value={qualitySlider}
                    onChange={(e) => setQualitySlider(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-zinc-950 h-1 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Dynamic Sound Modifiers */}
              <div className="space-y-3.5 pt-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] font-bold block">INTELLIGENT ENVELOPE MODS</label>
                
                {/* 1. Volume Boost slider */}
                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-[#27272A] space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1"><Volume2 className="w-3 h-3 text-indigo-400" /> GRAPHIC GAIN GAIN</span>
                    <span className="text-white">{(volumeBoost * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={volumeBoost}
                    onChange={(e) => setVolumeBoost(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-ew-resize h-1 rounded bg-[#09090B]"
                  />
                </div>

                {/* 2. Playback speed slider */}
                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-[#27272A] space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-purple-400" /> TEMPORAL SPEED SPEED</span>
                    <span className="text-white">{playbackSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-ew-resize h-1 rounded bg-[#09090B]"
                  />
                </div>

                {/* Switchable filters (Bass and Vocals) */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setBassBoost(!bassBoost)}
                    className={`px-3 py-2.5 rounded-xl text-left border text-[11px] transition-all flex items-center justify-between ${
                      bassBoost
                        ? "bg-indigo-950/30 border-indigo-500/50 text-indigo-300"
                        : "bg-zinc-950/30 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <span>Bass Boost</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${bassBoost ? 'bg-indigo-400 animate-pulse' : 'bg-transparent'}`} />
                  </button>

                  <button
                    onClick={() => setVocalIsolate(!vocalIsolate)}
                    className={`px-3 py-2.5 rounded-xl text-left border text-[11px] transition-all flex items-center justify-between ${
                      vocalIsolate
                        ? "bg-indigo-950/30 border-indigo-500/50 text-indigo-300"
                        : "bg-zinc-950/30 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <span>Vocal Isolation</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${vocalIsolate ? 'bg-indigo-400 animate-pulse' : 'bg-transparent'}`} />
                  </button>
                </div>
              </div>

              {/* Action Button trigger / Progress area */}
              <div className="pt-4 flex-1 flex flex-col justify-end">
                {isTranscoding || transcodeStatus ? (
                  /* Progress Tracking Interface panel */
                  <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs font-mono text-[#A1A1AA]">
                      <span>PIPE TASK PROGRESS</span>
                      <span className="font-semibold text-white">{(transcodeStatus?.progress || 0)}%</span>
                    </div>

                    <div className="h-2 bg-zinc-900 overflow-hidden rounded-full relative">
                      <div
                        className="h-full bg-gradient-to-r from-[#6366F1] to-[#A855F7] rounded-full transition-all duration-300"
                        style={{ width: `${transcodeStatus?.progress || 0}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-[#A1A1AA] font-mono leading-relaxed truncate">
                      {transcodeStatus?.message || "Scheduling cloud worker nodes..."}
                    </div>

                    {transcodeStatus?.status === 'completed' && (
                      <a
                        href={transcodeStatus.downloadUrl}
                        download
                        className="mt-2 w-full h-11 px-4 rounded-lg bg-green-600 text-white font-bold uppercase tracking-wider text-[11px] flex items-center justify-center gap-2 hover:bg-green-500 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>DOWNLOAD COMPILED FILE ({transcodeStatus.fileSize})</span>
                      </a>
                    )}
                  </div>
                ) : (
                  /* Standard pipeline starter */
                  <button
                    onClick={handleInitializePipeline}
                    className="w-full h-14 rounded-2xl bg-[#FAFAFA] text-[#09090B] font-bold uppercase tracking-[0.15em] text-xs hover:bg-white transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Flame className="w-4 h-4 fill-current text-indigo-600 animate-pulse" />
                    <span>Initialize Pipeline</span>
                  </button>
                )}
              </div>

            </div>

          </main>
        )}
      </div>

      {/* 3. Bottom Status Rail */}
      <footer className="h-10 border-t border-[#27272A] bg-[#09090B] px-6 md:px-8 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-[#A1A1AA]">
        <div className="flex space-x-3 md:space-x-6">
          <span className="hidden xs:inline">Node: AWS-USEAST-01</span>
          <span>Latency: 14ms</span>
          <span>FFmpeg: 6.1.1</span>
        </div>
        <div className="flex space-x-4">
          <span className="text-[#6366F1]">v0.9.4-BETA</span>
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] mr-1.5 animate-pulse" />
            Cloud Linked
          </span>
        </div>
      </footer>
    </div>
  );
}
