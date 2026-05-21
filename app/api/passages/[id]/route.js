import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json(
        { error: "You must be signed in to update passages" },
        { status: 401 }
      );
    }

    const { id } = await params;
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

    const result = await prisma.passage.updateMany({
      where: {
        id,
        user: {
          email: session.user.email,
        },
      },
      data: {
        title: title.trim(),
        originalText,
        parsedJson: parsedJson ?? null,
      },
    });

    if (result.count === 0) {
      return Response.json(
        { error: "Passage not found" },
        { status: 404 }
      );
    }

    const passage = await prisma.passage.findUnique({
      where: { id },
    });

    return Response.json({ passage });
  } catch (error) {
    console.error("Failed to update passage:", error);

    return Response.json(
      { error: "Failed to update passage" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json(
        { error: "You must be signed in to delete passages" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const result = await prisma.passage.deleteMany({
      where: {
        id,
        user: {
          email: session.user.email,
        },
      },
    });

    if (result.count === 0) {
      return Response.json(
        { error: "Passage not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete passage:", error);

    return Response.json(
      { error: "Failed to delete passage" },
      { status: 500 }
    );
  }
}