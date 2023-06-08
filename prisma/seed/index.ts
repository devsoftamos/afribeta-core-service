import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import logger from "moment-logger";
import { commissions } from "./commission";

async function main() {
    for (let commission of commissions) {
        await prisma.commission.upsert({
            where: { slug: commission.slug },
            update: {},
            create: commission,
        });
    }
}

main()
    .then(() => {
        logger.info("Database seeding successful");
    })
    .catch((err) => {
        logger.error(`Database seeding failed ${err}`);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
