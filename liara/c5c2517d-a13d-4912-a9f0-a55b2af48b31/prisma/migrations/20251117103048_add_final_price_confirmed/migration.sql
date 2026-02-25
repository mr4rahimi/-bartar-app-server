-- AlterTable
ALTER TABLE `order` ADD COLUMN `finalPriceConfirmed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `finalPriceConfirmedAt` DATETIME(3) NULL;
