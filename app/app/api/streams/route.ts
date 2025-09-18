import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {prismaCilent } from "@/app/lib/db";  // Confirm correct import name here
import youtubesearchapi from "youtube-search-api";

const YoutubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStreamSchema.parse(await req.json());
    const match = data.url.match(YoutubeRegex);
    if (!match) {
      return NextResponse.json({ message: "Invalid Youtube Url" }, { status: 411 });
    }

    const extractedId = match[1];

 

    const stream = await prismaCilent.stream.create({
      data: {
        userId: data.creatorId,
        addedBy: data.creatorId,
        url: data.url,
        type: "Youtube",
        extractedId,
      },
    });

    return NextResponse.json({ message: "Stream Added Successfully", id: stream.id }, { status: 200 });
  } catch (error: any) {
    console.error("Error in POST /stream:", error);
    return NextResponse.json({ message: error.message ?? "Invalid Format" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get("creatorId");
  const streams = await prismaCilent.user.findMany({
    where: { id: creatorId ?? "" },
  });
  return NextResponse.json({ streams });
}
