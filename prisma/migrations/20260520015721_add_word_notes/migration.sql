-- CreateTable
CREATE TABLE "WordNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lemma" TEXT NOT NULL,
    "surface" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WordNote_userId_lemma_key" ON "WordNote"("userId", "lemma");

-- AddForeignKey
ALTER TABLE "WordNote" ADD CONSTRAINT "WordNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
