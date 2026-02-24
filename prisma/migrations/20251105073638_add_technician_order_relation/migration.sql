/*
  Warnings:

  - The values [CANCELED] on the enum `Order_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [TECH_ASSIGNED,REPAIRING,FINISHED] on the enum `Order_orderStage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `order` ADD COLUMN `technicianId` INTEGER NULL,
    MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'NOT_REPAIRABLE', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    MODIFY `orderStage` ENUM('REGISTERED', 'PRICE_SET', 'TECHNICIAN_ASSIGNED', 'IN_REPAIR', 'READY_FOR_PICKUP', 'COMPLETED') NOT NULL DEFAULT 'REGISTERED';

-- CreateTable
CREATE TABLE `TechnicianProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `bio` VARCHAR(191) NULL,
    `experience` INTEGER NULL,
    `rating` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TechnicianProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TechnicianProfile` ADD CONSTRAINT `TechnicianProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
