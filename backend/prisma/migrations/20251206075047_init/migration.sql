-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "dateOfBirth" DATETIME,
    "phoneNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "preferredCurrency" TEXT NOT NULL DEFAULT 'USD',
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enableNudges" BOOLEAN NOT NULL DEFAULT true,
    "enableSustainability" BOOLEAN NOT NULL DEFAULT true,
    "enableNotifications" BOOLEAN NOT NULL DEFAULT true,
    "budgetAlertThreshold" REAL NOT NULL DEFAULT 80.0,
    "spendingWarningDays" INTEGER NOT NULL DEFAULT 7,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'SAVINGS',
    "provider" TEXT NOT NULL DEFAULT 'BANK',
    "accountNumber" TEXT,
    "balance" REAL NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebitCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "cardholderName" TEXT,
    "expirationMonth" INTEGER NOT NULL,
    "expirationYear" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DebitCard_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "payerId" TEXT,
    "payeeId" TEXT,
    "externalId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE',
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "subCategory" TEXT,
    "amount" REAL NOT NULL,
    "amountInBase" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" REAL NOT NULL DEFAULT 1.0,
    "description" TEXT,
    "merchantName" TEXT,
    "merchantCategory" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isEcoFriendly" BOOLEAN NOT NULL DEFAULT false,
    "ecoScore" REAL,
    "ecoTags" TEXT,
    "metadata" TEXT,
    "transactionDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Nudge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "threshold" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserNudge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nudgeId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserNudge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserNudge_nudgeId_fkey" FOREIGN KEY ("nudgeId") REFERENCES "Nudge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SustainabilityImpact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "carbonFootprint" REAL,
    "ecoScore" REAL NOT NULL,
    "impactCategory" TEXT NOT NULL,
    "suggestions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SustainabilityImpact_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SustainabilityMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "totalCarbonFootprint" REAL NOT NULL DEFAULT 0.0,
    "averageEcoScore" REAL NOT NULL DEFAULT 0.0,
    "ecoFriendlyCount" INTEGER NOT NULL DEFAULT 0,
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "topImpactCategories" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SustainabilityMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'USER',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyticsCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Account_provider_idx" ON "Account"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_provider_accountNumber_key" ON "Account"("userId", "provider", "accountNumber");

-- CreateIndex
CREATE INDEX "DebitCard_accountId_idx" ON "DebitCard"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_category_idx" ON "Transaction"("category");

-- CreateIndex
CREATE INDEX "Transaction_transactionDate_idx" ON "Transaction"("transactionDate");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "UserNudge_userId_idx" ON "UserNudge"("userId");

-- CreateIndex
CREATE INDEX "UserNudge_isRead_idx" ON "UserNudge"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "SustainabilityImpact_transactionId_key" ON "SustainabilityImpact"("transactionId");

-- CreateIndex
CREATE INDEX "SustainabilityMetric_userId_idx" ON "SustainabilityMetric"("userId");

-- CreateIndex
CREATE INDEX "SustainabilityMetric_periodStart_periodEnd_idx" ON "SustainabilityMetric"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "AnalyticsCache_expiresAt_idx" ON "AnalyticsCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsCache_userId_cacheKey_key" ON "AnalyticsCache"("userId", "cacheKey");
