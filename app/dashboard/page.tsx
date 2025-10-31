"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Heart, Users, LogOut, Trash, ChevronUp, ChevronDown, Music, Share2, PlayCircle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { signIn, signOut } from "next-auth/react";

interface Video {
  id: string;
  title: string;
  upvotes: number;
  downvotes: number;
  votes?: number;
  artist?: string;
  duration?: string;
  submittedBy?: string;
  smallImg?: string;
  extractedId?: string;
  bigImg?: string;
  hasUpvoted?: boolean;
}

const REFRESH_INTERVAL_MS = 10 * 1000;

export default function StreamingInterface() {
  const { data: session } = useSession();
  const router = useRouter();

  const [currentTrack, setCurrentTrack] = useState<Video>({
    id: (session?.user as { id?: string })?.id ?? "",
    title: "",
    votes: 0,
    duration: "",
    submittedBy: (session?.user as { email?: string })?.email ?? "",
    upvotes: 0,
    downvotes: 0,
  });

  const [queue, setQueue] = useState<Video[]>([]);
  const [newTrackUrl, setNewTrackUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const playerRef = useRef<unknown>(null);
  const isAdvancingRef = useRef<boolean>(false);
  const latestQueueRef = useRef<Video[]>([]);
  const latestCurrentIdRef = useRef<string | undefined>(undefined);
  const playedIdsRef = useRef<Set<string>>(new Set());

  async function refreshStreams() {
    try {
      const res = await fetch("/api/streams/my", {
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) {
        await signIn();
        return;
      }
      if (!res.ok) {
        console.error("refreshStreams failed", res.status);
        return;
      }
      const data = await res.json();
      const apiStreams = Array.isArray(data?.streams) ? data.streams : [];
      const mappedQueue: Video[] = apiStreams.slice(0, 4).map((s: { id: string; title?: string; smallImg?: string; extractedId?: string; duration?: string; artist?: string; _count?: { upvotes: number }; upvotes?: { id: string }[] }) => ({
        id: s.id,
        title: s.title ?? "",
        votes: (s._count?.upvotes as number) ?? 0,
        upvotes: (s._count?.upvotes as number) ?? 0,
        downvotes: 0,
        duration: s.duration ?? "",
        artist: s.artist ?? "YouTube",
        submittedBy: (session?.user as { email?: string })?.email ?? "",
        smallImg:
          s.smallImg ||
          (s.extractedId ? `https://i.ytimg.com/vi/${s.extractedId}/hqdefault.jpg` : ""),
        extractedId: s.extractedId,
        hasUpvoted: Array.isArray(s.upvotes) && s.upvotes.length > 0,
      }));
      const sortedByVotes = [...mappedQueue].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
      setQueue((_prev) => {
        const currentId = currentTrack?.id;
        if (currentId) {
          const currentInNew = sortedByVotes.find((t) => t.id === currentId);
          if (currentInNew) {
            const rest = sortedByVotes.filter((t) => t.id !== currentId);
            return [currentInNew, ...rest];
          }
        }
        return sortedByVotes;
      });
      if (mappedQueue.length > 0) {
        const top = [...mappedQueue].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))[0];
        setCurrentTrack((prev) => {
          const exists = mappedQueue.find((t) => t.id === prev.id);
          if (prev.id && exists) return prev;
          return {
            ...prev,
            id: top.id,
            title: top.title,
            artist: top.artist,
            duration: top.duration,
            submittedBy: top.submittedBy,
            extractedId: top.extractedId,
          };
        });
      }
    } catch (error) {
      console.error("refreshStreams error", error);
    }
  }

  useEffect(() => {
    refreshStreams();
    const interval = setInterval(() => {
      refreshStreams();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ((window as any).YT && (window as any).YT.Player) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  useEffect(() => {
    const yt = (window as { YT?: unknown }).YT;
    if (!currentTrack.extractedId) return;
    function ensurePlayer() {
      if (playerRef.current) {
        if (isAdvancingRef.current) {
          (playerRef.current as { loadVideoById: (id: string) => void; playVideo: () => void }).loadVideoById(currentTrack.extractedId!);
          try {
            (playerRef.current as { playVideo: () => void }).playVideo();
          } catch {}
          isAdvancingRef.current = false;
        }
        return;
      }
      playerRef.current = new (yt as { Player: new (id: string, config: unknown) => unknown }).Player("yt-player", {
        height: "100%",
        width: "100%",
        videoId: currentTrack.extractedId,
        playerVars: { autoplay: 1 },
        events: {
          onStateChange: (event: { data: number }) => {
            if (event.data === 0) {
              const currentId = latestCurrentIdRef.current;
              const snapshot = latestQueueRef.current ?? [];
              const sorted = [...snapshot].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
              if (currentId) playedIdsRef.current.add(currentId);
              const next = sorted.find(
                (t) => t.id !== currentId && !playedIdsRef.current.has(t.id)
              );
              if (next && next.extractedId) {
                isAdvancingRef.current = true;
                setCurrentTrack((prev) => ({
                  ...prev,
                  ...next,
                }));
              } else {
                playedIdsRef.current.clear();
                const fallback = sorted.find((t) => t.id !== currentId);
                if (fallback && fallback.extractedId) {
                  isAdvancingRef.current = true;
                  setCurrentTrack((prev) => ({
                    ...prev,
                    ...fallback,
                  }));
                }
              }
            }
          },
        },
      });
    }
    if (yt && (yt as { Player?: unknown }).Player) {
      ensurePlayer();
    } else {
      (window as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
        ensurePlayer();
      };
    }
  }, [currentTrack.extractedId, queue]);

  useEffect(() => {
    latestQueueRef.current = queue;
  }, [queue]);
  
  useEffect(() => {
    latestCurrentIdRef.current = currentTrack?.id;
  }, [currentTrack?.id]);

  const handleVote = async (id: string, upvote?: boolean) => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const updated = prev.map((track) =>
        track.id === id
          ? track.hasUpvoted
            ? track
            : { ...track, votes: (track.votes ?? 0) + 1, hasUpvoted: true }
          : track
      );
      const current = updated[0];
      const rest = updated.slice(1).sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
      return [current, ...rest];
    });
    try {
      await fetch("/api/streams/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ streamId: id, upvote: upvote ?? true }),
      });
    } catch (error) {
      console.error("handleVote error", error);
    }
  };

  const handleSubmitTrack = async () => {
    try {
      if (!newTrackUrl.trim()) return;
      setIsLoading(true);
      const res = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: newTrackUrl.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          await signIn();
          return;
        }
        throw new Error(data?.message ?? `Failed with ${res.status}`);
      }
      const match = newTrackUrl
        .trim()
        .match(
          /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))(([\w-]){11})(?:\S+)?$/
        );
      const extractedId = match ? match[1] : undefined;
      if (extractedId) {
        setCurrentTrack((prev) => ({ ...prev, extractedId }));
      }
      setNewTrackUrl("");
      await refreshStreams();
    } catch (err: unknown) {
      console.error("Error adding track:", (err as Error)?.message ?? err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownvote = async (id: string) => {
    setQueue((prev) =>
      prev.map((track) =>
        track.id === id
          ? track.hasUpvoted
            ? { ...track, votes: Math.max(0, (track.votes ?? 0) - 1), hasUpvoted: false }
            : track
          : track
      )
    );
    try {
      await fetch("/api/streams/downvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ streamId: id }),
      });
    } catch (error) {
      console.error("handleDownvote error", error);
    }
  };

  const handleDelete = async (id: string) => {
    setQueue((prev) => prev.filter((t) => t.id !== id));
    if (currentTrack?.id === id) {
      const sorted = [...queue].filter((t) => t.id !== id).sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
      const next = sorted[0];
      if (next) {
        isAdvancingRef.current = true;
        setCurrentTrack((prev) => ({ ...prev, ...next }));
      }
    }
    try {
      await fetch("/api/streams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ streamId: id }),
      });
    } catch (e: unknown) {
      console.error("delete error", e);
      await refreshStreams();
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: "Join my Music Stream",
        text: "Come listen and vote on tracks with me!",
        url: window.location.href,
      };
      if ((navigator as { share?: unknown }).share) {
        await (navigator as { share: (data: unknown) => Promise<void> }).share(shareData);
        return;
      }
      await navigator.clipboard.writeText(shareData.url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err: unknown) {
      console.error("Share failed", err);
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
           
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              SYNCORE
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copySuccess ? "Copied!" : "Share"}</span>
            </button>
            {session && (
              <button
                onClick={() => signOut().then(() => router.push(""))}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all duration-200 text-sm font-medium text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-zinc-900 to-black shadow-2xl">
              <div className="aspect-video bg-black relative">
                {currentTrack.extractedId ? (
                  <div id="yt-player" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center">
                        <PlayCircle className="w-10 h-10 text-white/40" />
                      </div>
                      <div>
                        <p className="text-white/60 text-sm font-medium">No track playing</p>
                        <p className="text-white/40 text-xs mt-1">Add a YouTube URL to start</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Track Info */}
              <div className="p-6 bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-sm border-t border-white/5">
                {currentTrack.title ? (
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold truncate">{currentTrack.title}</h2>
                    <div className="flex items-center gap-3 text-sm">
                      <p className="text-white/60">{currentTrack.artist}</p>
                      {currentTrack.duration && (
                        <>
                          <span className="text-white/30">•</span>
                          <p className="text-white/40 font-mono text-xs">{currentTrack.duration}</p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-white/50 text-sm">Add your first track to get started</p>
                )}
              </div>
            </div>

            {/* Add Track */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/50 to-black/50 backdrop-blur-sm p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-semibold tracking-wide uppercase text-white/90">
                  Add Track
                </h3>
              </div>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Paste YouTube URL here..."
                  value={newTrackUrl}
                  onChange={(e) => setNewTrackUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTrackUrl.trim() && queue.length < 4) {
                      handleSubmitTrack();
                    }
                  }}
                  className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none rounded-xl transition-all"
                />
                
                <button 
                  onClick={handleSubmitTrack} 
                  disabled={!newTrackUrl.trim() || queue.length >= 4 || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-white/10 disabled:to-white/10 disabled:cursor-not-allowed transition-all rounded-xl font-medium text-sm shadow-lg disabled:shadow-none flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Add</span>
                </button>
              </div>

              {queue.length >= 4 && (
                <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400 font-medium">
                    Queue is full (4/4). Remove a track to add more.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Queue Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                <h3 className="text-lg font-semibold tracking-tight">Up Next</h3>
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <p className="text-xs font-mono text-white/60">{queue.length - 1} tracks</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {queue.slice(1).length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/30 to-black/30 backdrop-blur-sm p-12 text-center">
                  <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Music className="w-8 h-8 text-white/40" />
                  </div>
                  <p className="text-sm text-white/60 font-medium">Queue is empty</p>
                  <p className="text-xs text-white/40 mt-1">Add tracks to build your playlist</p>
                </div>
              ) : (
                queue.slice(1).map((track, index) => (
                  <div
                    key={track.id}
                    className="group rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900/50 to-black/50 backdrop-blur-sm p-4 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-zinc-900/70 hover:to-black/70 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-start gap-3">
                      {/* Track Number */}
                      <div className="flex-shrink-0 w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                        <span className="text-xs font-bold text-white/60 font-mono">
                          {index + 2}
                        </span>
                      </div>
                      
                      {/* Track Image */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                        {track.smallImg ? (
                          <img
                            src={track.smallImg}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-6 h-6 text-white/30" />
                          </div>
                        )}
                      </div>
                      
                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate mb-1">{track.title}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <p className="text-white/50 truncate">{track.artist}</p>
                          {track.duration && (
                            <>
                              <span className="text-white/30">•</span>
                              <p className="text-white/40 font-mono">{track.duration}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                      <button
                        onClick={() => handleVote(track.id)}
                        disabled={!!track.hasUpvoted}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-medium border border-white/10 hover:border-purple-500/30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span className="font-mono font-bold">{track.votes}</span>
                      </button>
                      
                      {track.hasUpvoted && (
                        <button 
                          onClick={() => handleDownvote(track.id)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                        </button>
                      )}
                      
                      <div className="flex-1" />
                      
                      <button
                        onClick={() => handleDelete(track.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 transition-all border border-white/10 hover:border-red-500/30 group/delete"
                      >
                        <Trash className="w-3.5 h-3.5 text-white/60 group-hover/delete:text-red-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}