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
import { commissions } from "./commission";

async function main() {
    // for (let commission of commissions) {
    //     await prisma.commission.upsert({
    //         where: { slug: commission.slug },
    //         update: {},
    //         create: commission,
    //     });
    // }

    // for (let provider of billProviders) {
    //     await prisma.billProvider.upsert({
    //         where: { slug: provider.slug },
    //         update: {},
    //         create: provider,
    //     });
    // }
    for (let billService of billServiceData) {
        await prisma.billService.upsert({
            where: { slug: billService.slug },
            update: {},
            create: billService as any,
        });
    }

    // Electric Discos
    // for (let billProviderElectricDisco of billProviderElectricDiscos) {
    //     await prisma.billProviderElectricDisco.upsert({
    //         where: {
    //             billServiceSlug_billProviderSlug: {
    //                 billProviderSlug:
    //                     billProviderElectricDisco.billProviderSlug,
    //                 billServiceSlug: billProviderElectricDisco.billServiceSlug,
    //             },
    //         },
    //         update: {},
    //         create: billProviderElectricDisco,
    //     });
    // }

    //Airtime
    // for (let payload of billProviderAirtimeNetworks) {
    //     await prisma.billProviderAirtimeNetwork.upsert({
    //         where: {
    //             billServiceSlug_billProviderSlug: {
    //                 billProviderSlug: payload.billProviderSlug,
    //                 billServiceSlug: payload.billServiceSlug,
    //             },
    //         },
    //         update: {},
    //         create: payload,
    //     });
    // }

    // //Data
    // for (let payload of billProviderDataBundleNetworks) {
    //     await prisma.billProviderDataBundleNetwork.upsert({
    //         where: {
    //             billServiceSlug_billProviderSlug: {
    //                 billProviderSlug: payload.billProviderSlug,
    //                 billServiceSlug: payload.billServiceSlug,
    //             },
    //         },
    //         update: {},
    //         create: payload,
    //     });
    // }

    // //Cable TV
    // for (let payload of billProviderCableTVNetworks) {
    //     await prisma.billProviderCableTVNetwork.upsert({
    //         where: {
    //             billServiceSlug_billProviderSlug: {
    //                 billProviderSlug: payload.billProviderSlug,
    //                 billServiceSlug: payload.billServiceSlug,
    //             },
    //         },
    //         update: {},
    //         create: payload,
    //     });
    // }

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
