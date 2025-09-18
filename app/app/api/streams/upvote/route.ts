//Streaminf DownVote API END POINT
import { prismaCilent } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";
import { use } from "react";
import {z} from "zod";

const UpVoteSchema = z.object({
    streamId: z.string()
})
export async function POST(req: NextRequest){
    const session = await getServerSession();
 
    const user = await prismaCilent.user.findFirst({
        where:{
          email: session?.user?.email ?? ""
        }})

       if(!user){
        return NextResponse.json({
            message:"UNauthenticated"
        },{status:403})
    }
    try {
        const data = UpVoteSchema.parse(req.json());
        await prismaCilent.upvote.create({
            data:{
                userId: user.id,
                streamId:data.streamId
            }
        })
    } catch (e) {
         return NextResponse.json({
            message:"Error while UpVote"
        },{status:403})
    }

}