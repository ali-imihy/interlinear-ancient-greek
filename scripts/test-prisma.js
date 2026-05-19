import "dotenv/config";
import { prisma } from "../lib/prisma.js";

async function main() {
  const passage = await prisma.passage.create({
    data: {
      title: "Test Passage",
      originalText: "μῆνιν ἄειδε θεὰ",
      parsedJson: {
        test: true,
      },
    },
  });

  console.log("Created passage:");
  console.log(passage);
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });