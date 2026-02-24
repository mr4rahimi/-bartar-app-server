-- CreateTable
CREATE TABLE `CallLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `operatorId` INTEGER NOT NULL,
    `seq` INTEGER NOT NULL,
    `callTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `subjectText` TEXT NOT NULL,
    `serviceId` INTEGER NULL,
    `brandId` INTEGER NULL,
    `modelId` INTEGER NULL,
    `problemId` INTEGER NULL,
    `partId` INTEGER NULL,
    `callerPhone` VARCHAR(32) NOT NULL,
    `resultText` TEXT NULL,
    `finalStatus` ENUM('PENDING', 'FINAL') NOT NULL DEFAULT 'PENDING',
    `finalizedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CallLog_date_operatorId_idx`(`date`, `operatorId`),
    INDEX `CallLog_date_idx`(`date`),
    INDEX `CallLog_operatorId_idx`(`operatorId`),
    UNIQUE INDEX `CallLog_date_operatorId_seq_key`(`date`, `operatorId`, `seq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CallLog` ADD CONSTRAINT `CallLog_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
