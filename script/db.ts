import { PrismaClient } from "@prisma/client";
import logger from "moment-logger";

export class PrismaService extends PrismaClient {
    constructor() {
        super({
            log: ["info"],
        });
        this.connect();
    }
    async connect() {
        logger.log("Connecting to the database");
        await this.$connect();
        logger.info("Connected to the database");
    }
}
