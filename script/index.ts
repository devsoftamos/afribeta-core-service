import logger from "moment-logger";
import { PrismaService } from "./db";
import dbScript from "./dbScript";
//import { exportCommission, exportMerchantBalance } from "./createCsv";

async function run() {
    try {
        //connect to db
        const prisma = new PrismaService();

        //running script
        logger.info("running script...");

        // await exportMerchantBalance(prisma);
        // await exportCommission(prisma);
        await dbScript(prisma);

        //script completed
        logger.info("script completed successfully");
    } catch (error) {
        logger.error(error);
    }
}

run();
