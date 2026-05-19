import { prisma } from "@/lib/prisma";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.passage.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete passage:", error);

    return Response.json(
      { error: "Failed to delete passage" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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

    const passage = await prisma.passage.update({
      where: { id },
      data: {
        title: title.trim(),
        originalText,
        parsedJson: parsedJson ?? null,
      },
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