import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import logger from "moment-logger";
import { billProviders } from "./billProvider";
import { billProviderAirtimeNetworks } from "./billProviderAirtimeNetwork";
import { billProviderCableTVNetworks } from "./billProviderCableTvNetwork";
import { billProviderDataBundleNetworks } from "./billProviderDataBundleNetwork";
import { billProviderElectricDiscos } from "./billProviderElectricDisco";
import { billProviderInternetNetworks } from "./billProviderInternetNetwork";
import { billServiceData } from "./billService";
import { roles } from "./role";

async function main() {
    for (let provider of billProviders) {
        await prisma.billProvider.upsert({
            where: { slug: provider.slug },
            update: {},
            create: provider,
        });
    }
    for (let billService of billServiceData) {
        await prisma.billService.upsert({
            where: { slug: billService.slug },
            update: {},
            create: billService as any,
        });
    }

    //Electric Discos
    for (let billProviderElectricDisco of billProviderElectricDiscos) {
        await prisma.billProviderElectricDisco.upsert({
            where: {
                billServiceSlug_billProviderSlug: {
                    billProviderSlug:
                        billProviderElectricDisco.billProviderSlug,
                    billServiceSlug: billProviderElectricDisco.billServiceSlug,
                },
            },
            update: {},
            create: billProviderElectricDisco,
        });
    }

    //Airtime
    for (let payload of billProviderAirtimeNetworks) {
        await prisma.billProviderAirtimeNetwork.upsert({
            where: {
                billServiceSlug_billProviderSlug: {
                    billProviderSlug: payload.billProviderSlug,
                    billServiceSlug: payload.billServiceSlug,
                },
            },
            update: {},
            create: payload,
        });
    }

    //Data
    for (let payload of billProviderDataBundleNetworks) {
        await prisma.billProviderDataBundleNetwork.upsert({
            where: {
                billServiceSlug_billProviderSlug: {
                    billProviderSlug: payload.billProviderSlug,
                    billServiceSlug: payload.billServiceSlug,
                },
            },
            update: {},
            create: payload,
        });
    }

    //Cable TV
    for (let payload of billProviderCableTVNetworks) {
        await prisma.billProviderCableTVNetwork.upsert({
            where: {
                billServiceSlug_billProviderSlug: {
                    billProviderSlug: payload.billProviderSlug,
                    billServiceSlug: payload.billServiceSlug,
                },
            },
            update: {},
            create: payload,
        });
    }

    //Internet
    for (let payload of billProviderInternetNetworks) {
        await prisma.billProviderInternetNetwork.upsert({
            where: {
                billServiceSlug_billProviderSlug: {
                    billProviderSlug: payload.billProviderSlug,
                    billServiceSlug: payload.billServiceSlug,
                },
            },
            update: {},
            create: payload,
        });
    }

    //Role
    for (let role of roles) {
        await prisma.role.upsert({
            where: { slug: role.slug },
            update: {},
            create: role,
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
