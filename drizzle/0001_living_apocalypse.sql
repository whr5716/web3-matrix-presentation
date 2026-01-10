CREATE TABLE `comparisonResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`comparisonId` int NOT NULL,
	`wholesaleHotelRatesId` int,
	`publicPlatformId` int,
	`savingsAmount` decimal(10,2) NOT NULL,
	`savingsPercentage` decimal(5,2) NOT NULL,
	`cashBackAmount` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comparisonResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hotelComparisons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelName` varchar(255) NOT NULL,
	`location` varchar(255) NOT NULL,
	`checkInDate` varchar(10) NOT NULL,
	`checkOutDate` varchar(10) NOT NULL,
	`starRating` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hotelComparisons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priceData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`comparisonId` int NOT NULL,
	`platform` varchar(50) NOT NULL,
	`pricePerNight` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`screenshotUrl` text,
	`screenshotProcessedUrl` text,
	`extractedData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `priceData_id` PRIMARY KEY(`id`)
);
