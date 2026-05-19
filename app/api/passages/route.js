import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const passages = await prisma.passage.findMany({
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
    const body = await request.json();

    const { title, originalText, parsedJson } = body;

    if (!title?.trim()) {
      return Response.json(
        { error: "Title is required" },
        { status: 400 }
      );
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