import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function getSignedInUser() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });
}

export async function GET(request) {
  try {
    const user = await getSignedInUser();

    if (!user) {
      return Response.json(
        { error: "You must be signed in to view word notes" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lemma = searchParams.get("lemma");

    if (lemma) {
      const wordNote = await prisma.wordNote.findUnique({
        where: {
          userId_lemma: {
            userId: user.id,
            lemma,
          },
        },
      });

      return Response.json({ wordNote });
    }

    const wordNotes = await prisma.wordNote.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return Response.json({ wordNotes });
  } catch (error) {
    console.error("Failed to fetch word note:", error);

    return Response.json(
      { error: "Failed to fetch word note" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getSignedInUser();

    if (!user) {
      return Response.json(
        { error: "You must be signed in to save word notes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { lemma, surface, note } = body;

    if (!lemma?.trim()) {
      return Response.json(
        { error: "Lemma is required" },
        { status: 400 }
      );
    }

    if (!note?.trim()) {
      return Response.json(
        { error: "Note is required" },
        { status: 400 }
      );
    }

    const wordNote = await prisma.wordNote.upsert({
      where: {
        userId_lemma: {
          userId: user.id,
          lemma: lemma.trim(),
        },
      },
      update: {
        surface: surface?.trim() || null,
        note: note.trim(),
      },
      create: {
        userId: user.id,
        lemma: lemma.trim(),
        surface: surface?.trim() || null,
        note: note.trim(),
      },
    });

    return Response.json({ wordNote });
  } catch (error) {
    console.error("Failed to save word note:", error);

    return Response.json(
      { error: "Failed to save word note" },
      { status: 500 }
    );
  }
}