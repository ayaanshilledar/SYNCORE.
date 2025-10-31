//Streaminf DownVote API END POINT
import { prismaCilent } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";
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
        const body = await req.json();
        const data = UpVoteSchema.parse(body);
        await prismaCilent.upvote.delete({
            where:{ userId_streamId:
                {userId: user.id,
                streamId: data.streamId
            }}       
        })
        return NextResponse.json({message:"DownVote Successfull"})
    } catch (e) {
         return NextResponse.json({
            message:"Error while DownVote"
        },{status:403})
    }

}