import { createReadStream } from "fs";
import { PrismaService } from "./db";
import * as csv from "fast-csv";
import * as path from "path";
import { customAlphabet } from "nanoid";
import { Prisma } from "@prisma/client";

const readCSVFile = async () => {
    console.log(__dirname);
    return new Promise((resolve, reject) => {
        const results: any = [];
        createReadStream(
            path.resolve(__dirname, "../script/files/merchant.csv")
        )
            .pipe(csv.parse({ headers: true }))
            .on("error", (error) => reject(error))
            .on("data", (row) => results.push(row))
            .on("end", () => resolve(results));
    }) as Promise<
        { email: string; mainBalance: string; commissionBalance: string }[]
    >;
};

const readCommissionCSVFile = async () => {
    console.log(__dirname);
    return new Promise((resolve, reject) => {
        const results: any = [];
        createReadStream(
            path.resolve(__dirname, "../script/files/commission.csv")
        )
            .pipe(csv.parse({ headers: true }))
            .on("error", (error) => reject(error))
            .on("data", (row) => results.push(row))
            .on("end", () => resolve(results));
    }) as Promise<
        {
            billService: string;
            baseRate: string;
            defaultAgentRate: string;
        }[]
    >;
};

const readAgentCSVFile = async () => {
    console.log(__dirname);
    return new Promise((resolve, reject) => {
        const results: any = [];
        createReadStream(path.resolve(__dirname, "../script/files/agent.csv"))
            .pipe(csv.parse({ headers: true }))
            .on("error", (error) => reject(error))
            .on("data", (row) => results.push(row))
            .on("end", () => resolve(results));
    }) as Promise<
        {
            email: string;
        }[]
    >;
};

export default async function dbScript(prisma: PrismaService) {
    await updateWalletBalances(prisma);
}

//update wallet balances script
const updateWalletBalances = async (prisma: PrismaService) => {
    const wu: string[] = [];
    try {
        const readData = await readCSVFile();
        const userBalances = readData.filter(
            (d) => +d.mainBalance || +d.commissionBalance
        );
        for (const b of userBalances) {
            const wallet = await prisma.wallet.findFirst({
                where: {
                    user: {
                        email: b.email.trim(),
                    },
                },
            });
            if (wallet) {
                const alphaNumeric = "1234567890ABCDEFGH";
                const balRef = customAlphabet(alphaNumeric.toLowerCase(), 30)();
                const commRef = customAlphabet(
                    alphaNumeric.toLowerCase(),
                    30
                )();
                const balTransId = customAlphabet(alphaNumeric, 15)();
                const commTransId = customAlphabet(alphaNumeric, 15)();
                const mainBal = Number(b.mainBalance.trim().replace(/,/g, ""));
                const commBal = Number(
                    b.commissionBalance.trim().replace(/,/g, "")
                );
                await prisma.$transaction(
                    async (tx) => {
                        await tx.wallet.update({
                            where: {
                                id: wallet.id,
                            },
                            data: {
                                mainBalance: { increment: mainBal },
                                commissionBalance: { increment: commBal },
                            },
                        });
                        //create trans record
                        //main bal
                        await tx.transaction.create({
                            data: {
                                amount: mainBal,
                                userId: wallet.userId,
                                description:
                                    "Wallet credited from old platform balance of July 27, 2024 Batch D",
                                flow: "IN",
                                paymentChannel: "MANUAL",
                                paymentStatus: "SUCCESS",
                                paymentReference: balRef,
                                totalAmount: mainBal,
                                transactionId: balTransId,
                                status: "SUCCESS",
                                type: "WALLET_FUND",
                                shortDescription:
                                    "Added Wallet Balance from Old Platform",
                            },
                        });
                        //comm bal
                        await tx.transaction.create({
                            data: {
                                amount: commBal,
                                userId: wallet.userId,
                                description:
                                    "Commission credited from old platform balance of July 27, 2024 Batch D",
                                flow: "IN",
                                paymentChannel: "MANUAL",
                                paymentStatus: "SUCCESS",
                                paymentReference: commRef,
                                totalAmount: commBal,
                                transactionId: commTransId,
                                status: "SUCCESS",
                                type: "WALLET_FUND",
                                shortDescription:
                                    "Added Commission Balance from Old Platform",
                            },
                        });
                        console.log(
                            `completed agent ---------------------------`,
                            b
                        );
                    },
                    {
                        isolationLevel:
                            Prisma.TransactionIsolationLevel.Serializable,
                    }
                );
            } else {
                wu.push(b.email);
            }
        }
        console.log(wu, wu.length);
    } catch (error) {
        console.log(error, "***ERR****");
        console.log(wu, wu.length);
    }
};

// //revert merchant to default agent
// const revertmerchantToAgent = async (prisma: PrismaService) => {
//     const processed: string[] = [];
//     try {
//         const agents = await readAgentCSVFile();
//         for (const agent of agents) {
//             const user = await prisma.user.findUnique({
//                 where: { email: agent.email },
//             });
//             if (user) {
//                 await prisma.$transaction(async (tx) => {
//                     await tx.user.update({
//                         where: { id: user.id },
//                         data: {
//                             roleId: 3,
//                             userType: "AGENT",
//                             merchantUpgradeStatus: "PENDING",
//                             kycStatus: "PENDING",
//                         },
//                     });

//                     await tx.userCommission.deleteMany({
//                         where: { userId: user.id },
//                     });
//                 });

//                 console.log(agent.email);
//                 processed.push(agent.email);
//             }
//         }
//     } catch (error) {
//         console.log(error, "***ERR****");
//     } finally {
//         console.log(processed);
//     }
// };
