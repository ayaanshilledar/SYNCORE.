"use client";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Play, Pause, SkipForward, SkipBack, Volume2, Plus, Heart, Users, LogOut, X, ChevronUp, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { signIn, signOut } from "next-auth/react";
import { Trash } from "lucide-react";


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
  const creatorId = (session?.user as any)?.id as string | undefined;

  const [isPlaying, setIsPlaying] = useState(false);

  const [currentTrack, setCurrentTrack] = useState<Video>({
    id: (session?.user as any)?.id ?? "",
    title: "",
    votes: 0,
    duration: "",
    submittedBy: (session?.user as any)?.email ?? "",
    upvotes: 0,
    downvotes: 0,
  });

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
      const mappedQueue: Video[] = apiStreams.slice(0, 4).map((s: any) => ({
        id: s.id,
        title: s.title ?? "",
        votes: (s._count?.upvotes as number) ?? 0,
        upvotes: (s._count?.upvotes as number) ?? 0,
        downvotes: 0,
        duration: s.duration ?? "",
        artist: s.artist ?? "YouTube",
        submittedBy: (session?.user as any)?.email ?? "",
        smallImg:
          s.smallImg ||
          (s.extractedId ? `https://i.ytimg.com/vi/${s.extractedId}/hqdefault.jpg` : ""),
        extractedId: s.extractedId,
        hasUpvoted: Array.isArray(s.upvotes) && s.upvotes.length > 0,
      }));
      const sortedByVotes = [...mappedQueue].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
      setQueue((prev) => {
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

  const [queue, setQueue] = useState<Video[]>([]);
  const playerRef = useRef<any>(null);
  const isAdvancingRef = useRef<boolean>(false);
  const latestQueueRef = useRef<Video[]>([]);
  const latestCurrentIdRef = useRef<string | undefined>(undefined);
  const playedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ((window as any).YT && (window as any).YT.Player) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  useEffect(() => {
    const yt = (window as any).YT;
    if (!currentTrack.extractedId) return;
    function ensurePlayer() {
      if (playerRef.current) {
        if (isAdvancingRef.current) {
          playerRef.current.loadVideoById(currentTrack.extractedId);
          try {
            playerRef.current.playVideo();
          } catch {}
          isAdvancingRef.current = false;
        }
        return;
      }
      playerRef.current = new yt.Player("yt-player", {
        height: "100%",
        width: "100%",
        videoId: currentTrack.extractedId,
        playerVars: { autoplay: 1 },
        events: {
          onStateChange: (event: any) => {
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
    if (yt && yt.Player) {
      ensurePlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = () => {
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

  const [newTrackUrl, setNewTrackUrl] = useState("");

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
    } catch (err: any) {
      console.error("Error adding track:", err?.message ?? err);
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
    } catch (e) {
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
      if ((navigator as any)?.share) {
        await (navigator as any).share(shareData);
        return;
      }
      await navigator.clipboard.writeText(shareData.url);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Share failed", err);
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-wide">SYNCORE.</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="flex items-center text-xs gap-2 bg-transparent text-white px-2 py-2 rounded hover:bg-green-600 transition-colors duration-200"
            >
              <Users className="w-3 h-3" />
              SHARE
            </button>
            {session && (
              <button
  onClick={() => signOut().then(() => router.push("/"))}
  className="flex items-center text-xs gap-2 bg-transparent text-white px-2 py-2 rounded hover:bg-red-600 transition-colors duration-200"
>
  <LogOut className="w-4 h-4" />
  LOGOUT
</button>

            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Player */}
          <div className="border border-white/10 bg-black">
            <div className="aspect-video bg-black">
              {currentTrack.extractedId ? (
                <div id="yt-player" className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">♪</div>
                    <p className="text-white/40 text-xs">NO TRACK PLAYING</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Track Info */}
         <div className="border border-white/10 p-4 hover:bg-white/5 transition-colors">
  {currentTrack.title ? (
    <div>
      <h2 className="text-lg font-light mb-1 truncate text-white">{currentTrack.title}</h2>
      <p className="text-white/60 text-xs">{currentTrack.artist}</p>
    </div>
  ) : (
    <p className="text-white/60 text-xs">Add a track to get started</p>
  )}
</div>

          </div>

          {/* Add Track */}
         <div className="border border-white/10 p-4 hover:bg-white/5 transition-colors">
  <h3 className="text-xs font-light mb-3 tracking-wide text-white/70">ADD TRACK</h3>
  
  <div className="flex gap-2">
    <input
      type="text"
      placeholder="YouTube URL"
      value={newTrackUrl}
      onChange={(e) => setNewTrackUrl(e.target.value)}
      className="flex-1 bg-transparent border border-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none rounded-md"
    />
    
    <button 
      onClick={handleSubmitTrack} 
      disabled={!newTrackUrl.trim() || queue.length >= 4}
      className="px-3 py-1.5 border border-white/10 hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-md"
    >
      <Plus className="w-3 h-3 text-white" />
    </button>
  </div>

  {queue.length >= 4 && (
    <p className="mt-2 text-xs text-red">Queue is full. Remove a track to add more.</p>
  )}
</div>

        </div>

        {/* Queue Section */}
        <div className="space-y-6">
          <h3 className="text-sm font-light tracking-wide">QUEUE</h3>
          
          <div className="space-y-3">
            {queue.slice(1).length === 0 ? (
              <div className="text-center py-12 text-white">
                <div className="text-2xl mb-2">♫</div>
                <p className="text-xs">Queue is empty</p>
              </div>
            ) : (
              queue.slice(1).map((track, index) => (
                <div
                  key={track.id}
                  className="border border-white/10 p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Track Number */}
                    <span className="text-xs text-white font-mono mt-1 w-4">
                      {(index + 2).toString().padStart(2, '0')}
                    </span>
                    
                    {/* Track Image */}
                    <div className="w-12 h-12 bg-white/10 flex-shrink-0">
                      {track.smallImg ? (
                        <img
                          src={track.smallImg}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                          ♪
                        </div>
                      )}
                    </div>
                    
                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-light truncate">{track.title}</p>
                      <p className="text-xs text-white/60 truncate">{track.artist}</p>
                      {track.duration && (
                        <p className="text-xs text-white/40 font-mono">{track.duration}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleVote(track.id)}
                      disabled={!!track.hasUpvoted}
                      className="flex items-center gap-1 text-xs hover:text-white/80 disabled:opacity-40 transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                      <span className="font-mono">{track.votes}</span>
                    </button>
                    
                    {track.hasUpvoted && (
                      <button 
                        onClick={() => handleDownvote(track.id)}
                        className="text-xs text-white/60 hover:text-white/80 transition-colors"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    )}
                    
                    <div className="flex-1" />
                    
                    <button
                      onClick={() => handleDelete(track.id)}
                      className="text-xs text-white/60 hover:text-red-500 transition-colors"
                    >

                      <Trash className="w-4 h-4 border-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}