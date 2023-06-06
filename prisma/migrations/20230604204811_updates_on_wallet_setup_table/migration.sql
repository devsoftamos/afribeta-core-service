/*
  Warnings:

  - You are about to drop the column `bankVerificationNumber` on the `VirtualBankAccounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Banks` ADD COLUMN `bankCodeProvider` ENUM('paystack', 'providus_bank') NOT NULL DEFAULT 'providus_bank';

-- AlterTable
ALTER TABLE `Users` ADD COLUMN `customerCode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `VirtualBankAccounts` DROP COLUMN `bankVerificationNumber`;
