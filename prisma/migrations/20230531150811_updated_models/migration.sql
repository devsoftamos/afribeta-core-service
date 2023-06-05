/*
  Warnings:

  - You are about to drop the column `bankVerificationNumber` on the `Banks` table. All the data in the column will be lost.
  - The values [WALLET_FUND_REQUEST] on the enum `Notifications_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `activated` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Banks` DROP COLUMN `bankVerificationNumber`,
    ADD COLUMN `bankCode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Notifications` MODIFY `type` ENUM('wallet_fund_request') NOT NULL;

-- AlterTable
ALTER TABLE `Users` DROP COLUMN `activated`,
    ADD COLUMN `cacNumber` VARCHAR(191) NULL,
    ADD COLUMN `notificationToken` VARCHAR(191) NULL,
    ADD COLUMN `utilityDocumentUrl` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `VirtualBankAccounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `bankVerificationNumber` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `provider` ENUM('paystack', 'providus_bank') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VirtualBankAccounts_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('airtime_to_cash', 'data_purchase', 'transfer', 'wallet_fund', 'electricity_bill', 'internet_bill', 'cableTv_bill') NOT NULL,
    `flow` ENUM('IN', 'OUT') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `serviceCharge` DOUBLE NULL,
    `totalAmount` DOUBLE NOT NULL,
    `status` ENUM('pending', 'success', 'approved', 'failed', 'declined') NOT NULL,
    `paymentStatus` ENUM('pending', 'success', 'failed') NULL,
    `userId` INTEGER NOT NULL,
    `senderId` INTEGER NOT NULL,
    `receiverId` INTEGER NOT NULL,
    `destinationBankName` VARCHAR(191) NULL,
    `destinationBankAccountNumber` VARCHAR(191) NULL,
    `destinationBankAccountName` VARCHAR(191) NULL,
    `description` VARCHAR(255) NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NULL,
    `providerLogo` VARCHAR(191) NULL,
    `accountId` VARCHAR(191) NULL,
    `packageType` VARCHAR(191) NULL,
    `meterType` VARCHAR(191) NULL,
    `phone1` VARCHAR(191) NULL,
    `phone2` VARCHAR(191) NULL,
    `paymentMethod` ENUM('wallet', 'paystack', 'providus_transfer') NULL,
    `token` VARCHAR(191) NULL,
    `commission` DOUBLE NULL,
    `merchantCommission` DOUBLE NULL,
    `companyCommission` DOUBLE NULL,
    `walletFundTransactionFlow` ENUM('to_agent', 'to_beneficiary', 'from_merchant', 'from_benefactor', 'self_fund', 'from_paid_commission') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VirtualBankAccounts` ADD CONSTRAINT `VirtualBankAccounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transactions` ADD CONSTRAINT `Transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transactions` ADD CONSTRAINT `Transactions_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transactions` ADD CONSTRAINT `Transactions_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
