"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AddVideoForm() {
  const [videoLink, setVideoLink] = useState("")
  const [error, setError] = useState("")

  const isValidYouTubeUrl = (url: string) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    return regex.test(url)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!videoLink) {
      setError("Video link cannot be empty.")
      return
    }

    if (!isValidYouTubeUrl(videoLink)) {
      setError("Please enter a valid YouTube video link.")
      return
    }

    console.log("[v0] Submitting video link:", videoLink)
    alert(`Video link submitted: ${videoLink}`)
    setVideoLink("")
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-foreground">Add YouTube Video</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="Enter YouTube video link"
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
            className="bg-input text-foreground border-border focus:ring-ring"
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Add to Queue
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
