import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json(
        { error: "You must be signed in to view passages" },
        { status: 401 }
      );
    }

    const passages = await prisma.passage.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        originalText: true,
        parsedJson: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ passages });
  } catch (error) {
    console.error("Failed to fetch passages:", error);

    return Response.json(
      { error: "Failed to fetch passages" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json(
        { error: "You must be signed in to save passages" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, originalText, parsedJson } = body;

    if (!title?.trim()) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    if (!originalText?.trim()) {
      return Response.json(
        { error: "Original text is required" },
        { status: 400 }
      );
    }

    const passage = await prisma.passage.create({
      data: {
        title: title.trim(),
        originalText,
        parsedJson: parsedJson ?? null,
        user: {
          connect: {
            email: session.user.email,
          },
        },
      },
    });

    return Response.json({ passage }, { status: 201 });
  } catch (error) {
    console.error("Failed to save passage:", error);

    return Response.json(
      { error: "Failed to save passage" },
      { status: 500 }
    );
  }
}