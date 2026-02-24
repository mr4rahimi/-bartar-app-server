-- AlterTable
ALTER TABLE `order` ADD COLUMN `brandId` INTEGER NULL,
    ADD COLUMN `modelId` INTEGER NULL,
    ADD COLUMN `serviceId` INTEGER NULL,
    MODIFY `brand` VARCHAR(191) NULL,
    MODIFY `model` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `DeviceModel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
