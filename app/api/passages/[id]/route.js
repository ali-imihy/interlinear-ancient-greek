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