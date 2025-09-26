"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ThumbsUpIcon, ThumbsDownIcon } from "lucide-react"
import Image from "next/image"
import { useState } from "react" // Import useState

interface Video {
  id: string
  title: string
  thumbnail: string
  youtubeUrl: string
  upvotes: number
  downvotes: number
}

export function VideoQueue() {
  const [videos, setVideos] = useState<Video[]>([
    {
      id: "1",
      title: "Lo-fi Hip Hop Radio - Beats to Relax/Study To",
      thumbnail: "/placeholder.svg?key=gm7b6",
      youtubeUrl: "https://www.youtube.com/watch?v=5qap5aO4i9A",
      upvotes: 120,
      downvotes: 5,
    },
    {
      id: "2",
      title: "Chillhop Radio - jazzy & lofi hip hop beats",
      thumbnail: "/placeholder.svg?key=g38ds",
      youtubeUrl: "https://www.youtube.com/watch?v=DWmGGi0212Q",
      upvotes: 80,
      downvotes: 2,
    },
    {
      id: "3",
      title: "The Lofi Study Girl - Relaxing Music",
      thumbnail: "/placeholder.svg?key=uus8r",
      youtubeUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
      upvotes: 150,
      downvotes: 10,
    },
  ])

  const handleUpvote = (id: string) => {
    setVideos((prevVideos) =>
      prevVideos.map((video) => (video.id === id ? { ...video, upvotes: video.upvotes + 1 } : video)),
    )
    console.log(`[v0] Upvoted video: ${id}`)
  }

  const handleDownvote = (id: string) => {
    setVideos((prevVideos) =>
      prevVideos.map((video) => (video.id === id ? { ...video, downvotes: video.downvotes + 1 } : video)),
    )
    console.log(`[v0] Downvoted video: ${id}`)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-foreground">Video Queue</CardTitle>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <p className="text-muted-foreground">No videos in the queue yet. Add some!</p>
        ) : (
          <div className="grid gap-4">
            {videos.map((video) => (
              <div key={video.id} className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border">
                <Image
                  src={video.thumbnail || "/placeholder.svg"}
                  alt={video.title}
                  width={160}
                  height={90}
                  className="rounded-md object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{video.title}</h3>
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline"
                  >
                    Watch on YouTube
                  </a>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-green-500">
                    <ThumbsUpIcon
                      className="h-5 w-5 cursor-pointer hover:text-green-400"
                      onClick={() => handleUpvote(video.id)}
                    />
                    <span>{video.upvotes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-500">
                    <ThumbsDownIcon
                      className="h-5 w-5 cursor-pointer hover:text-red-400"
                      onClick={() => handleDownvote(video.id)}
                    />
                    <span>{video.downvotes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
import type React from "react"