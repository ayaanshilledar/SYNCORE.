import { prismaCilent } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  const user = await prismaCilent.user.findFirst({
    where: {
      email: session?.user?.email ?? "",
    },
  });

  if (!user) {
    return NextResponse.json(
      { message: "unauthenticated" },
      { status: 403 }
    );
  }

  const streams = await prismaCilent.stream.findMany({
    where: { userId: user.id },
    orderBy: { upvotes: { _count: 'desc' } },
    take: 4,
    select: {
      id: true,
      title: true,
      smallImg: true,
      bigImg: true,
      extractedId: true,
      url: true,
      // duration is not in schema; if needed, add in DB. Leaving out for speed.
      _count: { select: { upvotes: true } },
      upvotes: { where: { userId: user.id }, select: { id: true } },
    },
  });

  return NextResponse.json({ streams });
}