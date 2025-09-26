import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaCilent } from "@/app/lib/db";  // fixed spelling
import youtubesearchapi from "youtube-search-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const YoutubeRegex =
  /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;

const CreateStreamSchema = z.object({
  creatorId: z.string().optional(),
  url: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = await prismaCilent.user.findFirst({
      where: { email: session?.user?.email ?? "" },
    });

    if (!user) {
      return NextResponse.json({ message: "unauthenticated" }, { status: 403 });
    }

    const body = await req.json();
    const data = CreateStreamSchema.parse(body);
    const match = data.url.match(YoutubeRegex);

   const thumbnails = (body?.thumbnail?.thumbnails ?? body?.thumbnails ?? []) as Array<{ url: string; width?: number }>;
   if (Array.isArray(thumbnails)) {
     thumbnails.sort((a, b) => (a?.width ?? 0) - (b?.width ?? 0));
   }

    if (!match) {
      return NextResponse.json(
        { message: "Invalid Youtube Url" },
        { status: 411 }
      );
    }

    const extractedId = match[1];

    // Choose thumbnails from payload if provided; otherwise, fall back to YouTube static URLs
    const smallImgUrl = (thumbnails[0]?.url ?? `https://i.ytimg.com/vi/${extractedId}/hqdefault.jpg`);
    const bigImgUrl = (thumbnails[thumbnails.length - 1]?.url ?? `https://i.ytimg.com/vi/${extractedId}/maxresdefault.jpg`);

    // Try to populate title via YouTube oEmbed (best-effort)
    let resolvedTitle: string | undefined;
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${extractedId}&format=json`);
      if (oembedRes.ok) {
        const meta = await oembedRes.json();
        if (typeof meta?.title === "string") {
          resolvedTitle = meta.title;
        }
      }
    } catch {}

    const stream = await prismaCilent.stream.create({
      data: {
        userId: user.id,
        addedBy: user.id,
        url: data.url,
        type: "Youtube",
        extractedId,
         smallImg: smallImgUrl,
         bigImg: bigImgUrl,
         // Save title if available; otherwise keep default "" from schema
         ...(resolvedTitle ? { title: resolvedTitle } : {}),
      },
    });

    return NextResponse.json(
      { message: "Stream Added Successfully", id: stream.id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in POST /streams:", error);
    return NextResponse.json(
      { message: error.message ?? "Invalid Format" },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get("creatorId");
  const streams = await prismaCilent.user.findMany({
    where: { id: creatorId ?? "" },
  });
  return NextResponse.json({ streams });
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = await prismaCilent.user.findFirst({
      where: { email: session?.user?.email ?? "" },
    });
    if (!user) {
      return NextResponse.json({ message: "unauthenticated" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({} as any));
    const streamId = body?.streamId as string | undefined;
    if (!streamId) {
      return NextResponse.json({ message: "streamId required" }, { status: 400 });
    }
    // Ensure the stream belongs to the current user
    const stream = await prismaCilent.stream.findFirst({
      where: { id: streamId, userId: user.id },
      select: { id: true },
    });
    if (!stream) {
      return NextResponse.json({ message: "not found" }, { status: 404 });
    }
    await prismaCilent.stream.delete({ where: { id: streamId } });
    return NextResponse.json({ message: "deleted" });
  } catch (e: any) {
    console.error("Error deleting stream:", e);
    return NextResponse.json({ message: e?.message ?? "delete failed" }, { status: 400 });
  }
}
