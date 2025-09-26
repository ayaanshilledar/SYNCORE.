// Streaming UpVote API endpoint
import { prismaCilent } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const UpVoteSchema = z.object({
    streamId: z.string()
})
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
 
    const user = await prismaCilent.user.findFirst({
        where:{
          email: session?.user?.email ?? ""
        }})

    if (!user) {
        return NextResponse.json({
            message: "unauthenticated",
        }, { status: 403 });
    }
    try {
        const body = await req.json();
        const data = UpVoteSchema.parse(body);
        // Enforce single upvote per user per stream
        const existing = await prismaCilent.upvote.findUnique({
          where: { userId_streamId: { userId: user.id, streamId: data.streamId } },
        });
        if (existing) {
          return NextResponse.json({ message: "already upvoted" }, { status: 200 });
        }
        await prismaCilent.upvote.create({
            data:{
                userId: user.id,
                streamId:data.streamId
            }
        })
        return NextResponse.json({ message: "Upvote successful" });
    } catch (e) {
        console.error("upvote error", e);
        return NextResponse.json({
            message: "error while upvoting",
        }, { status: 400 });
    }

}