-- CreateTable
CREATE TABLE `OtpCode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(191) NOT NULL,
    `purpose` ENUM('REGISTER', 'LOGIN') NOT NULL,
    `codeHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OtpCode_phone_purpose_createdAt_idx`(`phone`, `purpose`, `createdAt`),
    INDEX `OtpCode_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `channel` ENUM('PUSH', 'SMS') NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `title` VARCHAR(191) NULL,
    `body` VARCHAR(191) NOT NULL,
    `dataJson` TEXT NULL,
    `provider` VARCHAR(191) NULL,
    `error` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sentAt` DATETIME(3) NULL,

    INDEX `Notification_userId_channel_status_idx`(`userId`, `channel`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('user', 'admin', 'technician') NOT NULL DEFAULT 'user',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `walletBalance` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `User_phone_key`(`phone`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeviceToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `platform` ENUM('android', 'ios', 'web') NOT NULL DEFAULT 'android',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DeviceToken_token_key`(`token`),
    INDEX `DeviceToken_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `WalletTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WalletTransaction_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNumber` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `deviceType` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `issue` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'NOT_REPAIRABLE', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `orderStage` ENUM('REGISTERED', 'PRICE_SET', 'TECHNICIAN_ASSIGNED', 'IN_REPAIR', 'READY_FOR_PICKUP', 'COMPLETED') NOT NULL DEFAULT 'REGISTERED',
    `notes` VARCHAR(191) NULL,
    `pickupMethod` ENUM('PICKUP', 'IN_PERSON', 'ON_SITE') NOT NULL,
    `basePrice` DOUBLE NULL,
    `finalPrice` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `brandId` INTEGER NULL,
    `modelId` INTEGER NULL,
    `serviceId` INTEGER NULL,
    `technicianId` INTEGER NULL,
    `finalPriceConfirmed` BOOLEAN NOT NULL DEFAULT false,
    `finalPriceConfirmedAt` DATETIME(3) NULL,
    `problemId` INTEGER NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    INDEX `Order_brandId_fkey`(`brandId`),
    INDEX `Order_modelId_fkey`(`modelId`),
    INDEX `Order_problemId_fkey`(`problemId`),
    INDEX `Order_serviceId_fkey`(`serviceId`),
    INDEX `Order_technicianId_fkey`(`technicianId`),
    INDEX `Order_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `actorId` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `details` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderReport_actorId_fkey`(`actorId`),
    INDEX `OrderReport_orderId_fkey`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Service` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `iconUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `active` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Service_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Brand` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `iconUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `active` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Brand_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BrandService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brandId` INTEGER NOT NULL,
    `serviceId` INTEGER NOT NULL,

    INDEX `BrandService_serviceId_fkey`(`serviceId`),
    UNIQUE INDEX `BrandService_brandId_serviceId_key`(`brandId`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeviceModel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `brandId` INTEGER NOT NULL,
    `serviceId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `DeviceModel_serviceId_fkey`(`serviceId`),
    UNIQUE INDEX `DeviceModel_brandId_name_key`(`brandId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Problem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `serviceId` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Problem_serviceId_idx`(`serviceId`),
    UNIQUE INDEX `Problem_serviceId_name_key`(`serviceId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Banner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `linkUrl` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ticket` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'open',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Ticket_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Part` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `serviceId` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Part_serviceId_name_key`(`serviceId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartPrice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceId` INTEGER NOT NULL,
    `brandId` INTEGER NULL,
    `modelId` INTEGER NULL,
    `partId` INTEGER NOT NULL,
    `price` INTEGER NOT NULL,
    `highCopyPrice` INTEGER NULL,
    `copyPrice` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PartPrice_serviceId_brandId_modelId_partId_idx`(`serviceId`, `brandId`, `modelId`, `partId`),
    INDEX `PartPrice_brandId_fkey`(`brandId`),
    INDEX `PartPrice_modelId_fkey`(`modelId`),
    INDEX `PartPrice_partId_fkey`(`partId`),
    UNIQUE INDEX `PartPrice_serviceId_brandId_modelId_partId_key`(`serviceId`, `brandId`, `modelId`, `partId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProblemPart` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `problemId` INTEGER NOT NULL,
    `partId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ProblemPart_problemId_key`(`problemId`),
    INDEX `ProblemPart_partId_fkey`(`partId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartLabor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceId` INTEGER NOT NULL,
    `partId` INTEGER NOT NULL,
    `brandId` INTEGER NULL,
    `modelId` INTEGER NULL,
    `laborFee` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PartLabor_serviceId_partId_brandId_modelId_idx`(`serviceId`, `partId`, `brandId`, `modelId`),
    INDEX `PartLabor_brandId_fkey`(`brandId`),
    INDEX `PartLabor_modelId_fkey`(`modelId`),
    INDEX `PartLabor_partId_fkey`(`partId`),
    UNIQUE INDEX `PartLabor_serviceId_partId_brandId_modelId_key`(`serviceId`, `partId`, `brandId`, `modelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PricingConfig` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `partMarkupPercent` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceToken` ADD CONSTRAINT `DeviceToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TechnicianProfile` ADD CONSTRAINT `TechnicianProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WalletTransaction` ADD CONSTRAINT `WalletTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `DeviceModel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_problemId_fkey` FOREIGN KEY (`problemId`) REFERENCES `Problem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderReport` ADD CONSTRAINT `OrderReport_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderReport` ADD CONSTRAINT `OrderReport_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BrandService` ADD CONSTRAINT `BrandService_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BrandService` ADD CONSTRAINT `BrandService_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceModel` ADD CONSTRAINT `DeviceModel_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceModel` ADD CONSTRAINT `DeviceModel_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Problem` ADD CONSTRAINT `Problem_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Part` ADD CONSTRAINT `Part_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartPrice` ADD CONSTRAINT `PartPrice_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartPrice` ADD CONSTRAINT `PartPrice_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `DeviceModel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartPrice` ADD CONSTRAINT `PartPrice_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartPrice` ADD CONSTRAINT `PartPrice_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProblemPart` ADD CONSTRAINT `ProblemPart_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProblemPart` ADD CONSTRAINT `ProblemPart_problemId_fkey` FOREIGN KEY (`problemId`) REFERENCES `Problem`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartLabor` ADD CONSTRAINT `PartLabor_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartLabor` ADD CONSTRAINT `PartLabor_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `DeviceModel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartLabor` ADD CONSTRAINT `PartLabor_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartLabor` ADD CONSTRAINT `PartLabor_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

