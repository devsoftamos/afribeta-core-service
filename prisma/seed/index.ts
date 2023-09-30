import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import logger from "moment-logger";
import { banks } from "./bank";
import { billProviders } from "./billProvider";
import { billProviderAirtimeNetworks } from "./billProviderAirtimeNetwork";
import { billProviderCableTVNetworks } from "./billProviderCableTvNetwork";
import { billProviderDataBundleNetworks } from "./billProviderDataBundleNetwork";
import { billProviderElectricDiscos } from "./billProviderElectricDisco";
import { billProviderInternetNetworks } from "./billProviderInternetNetwork";
import { billServiceData } from "./billService";
import { lgas } from "./lga";
import { permissions } from "./permission";
import { roles } from "./role";
import { rolePermissions } from "./rolePermission";
import { states } from "./state";

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

    //Permission
    for (let permission of permissions) {
        await prisma.permission.upsert({
            where: { name: permission.name },
            update: {},
            create: permission,
        });
    }

    //Role Permissions
    for (let rolePermission of rolePermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    permissionId: rolePermission.permissionId,
                    roleId: rolePermission.roleId,
                },
            },
            update: {},
            create: rolePermission,
        });
    }

    //states
    for (let state of states) {
        await prisma.state.upsert({
            where: { slug: state.slug },
            update: {},
            create: state,
        });
    }

    //lgas
    for (let lga of lgas) {
        await prisma.localGovernmentArea.upsert({
            where: {
                name_stateId: {
                    name: lga.name,
                    stateId: lga.stateId,
                },
            },
            update: {},
            create: lga,
        });
    }

    //banks
    for (let bank of banks) {
        await prisma.bank.upsert({
            where: { slug: bank.slug },
            update: {},
            create: bank,
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
