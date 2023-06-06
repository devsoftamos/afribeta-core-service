/*
  Warnings:

  - You are about to alter the column `bankCodeProvider` on the `Banks` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(7))` to `Enum(EnumId(3))`.
  - The values [providus_bank] on the enum `VirtualBankAccounts_provider` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `bankCode` on table `Banks` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Banks` MODIFY `bankCode` VARCHAR(191) NOT NULL,
    MODIFY `bankCodeProvider` ENUM('paystack', 'providus') NOT NULL DEFAULT 'providus';

-- AlterTable
ALTER TABLE `VirtualBankAccounts` MODIFY `provider` ENUM('paystack', 'providus') NOT NULL;
