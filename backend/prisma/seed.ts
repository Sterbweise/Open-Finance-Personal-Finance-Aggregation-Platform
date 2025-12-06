/**
 * Database Seed Script
 * Generates sample data for development
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

const prisma = new PrismaClient();

// String constants instead of enums (for SQLite compatibility)
const TransactionType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  TRANSFER: "TRANSFER",
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
} as const;

const TransactionCategory = {
  FOOD_DINING: "FOOD_DINING",
  GROCERIES: "GROCERIES",
  TRANSPORTATION: "TRANSPORTATION",
  UTILITIES: "UTILITIES",
  ENTERTAINMENT: "ENTERTAINMENT",
  SHOPPING: "SHOPPING",
  HEALTHCARE: "HEALTHCARE",
  EDUCATION: "EDUCATION",
  TRAVEL: "TRAVEL",
  PERSONAL_CARE: "PERSONAL_CARE",
  HOME: "HOME",
  INVESTMENTS: "INVESTMENTS",
  INCOME: "INCOME",
  TRANSFER: "TRANSFER",
  OTHER: "OTHER",
} as const;

const AccountType = {
  SAVINGS: "SAVINGS",
  CURRENT: "CURRENT",
  EWALLET: "EWALLET",
  CREDIT_CARD: "CREDIT_CARD",
} as const;

const Provider = {
  BANK: "BANK",
  GRABPAY: "GRABPAY",
  TNG: "TNG",
  SHOPEEPAY: "SHOPEEPAY",
  VIRTUAL_BANK: "VIRTUAL_BANK",
  MANUAL: "MANUAL",
} as const;

const CATEGORIES = [
  TransactionCategory.FOOD_DINING,
  TransactionCategory.GROCERIES,
  TransactionCategory.TRANSPORTATION,
  TransactionCategory.ENTERTAINMENT,
  TransactionCategory.SHOPPING,
  TransactionCategory.UTILITIES,
];

const MERCHANTS: Record<string, string[]> = {
  [TransactionCategory.FOOD_DINING]: [
    "Nasi Lemak Corner",
    "Mamak Stall",
    "KFC Malaysia",
    "McDonald's",
    "Starbucks",
  ],
  [TransactionCategory.GROCERIES]: [
    "Tesco",
    "Giant",
    "Jaya Grocer",
    "99 Speedmart",
    "Mydin",
  ],
  [TransactionCategory.TRANSPORTATION]: [
    "Grab",
    "Shell",
    "Petronas",
    "Touch 'n Go Reload",
    "MRT Ticket",
  ],
  [TransactionCategory.ENTERTAINMENT]: [
    "Netflix",
    "Spotify",
    "TGV Cinemas",
    "Steam",
    "PlayStation",
  ],
  [TransactionCategory.SHOPPING]: ["Shopee", "Lazada", "IKEA", "Uniqlo", "H&M"],
  [TransactionCategory.UTILITIES]: [
    "TNB",
    "Maxis",
    "Digi",
    "Celcom",
    "TM Unifi",
  ],
};

async function seed() {
  console.log("🌱 Seeding database...");

  // Create demo user with Malaysian preferences
  const passwordHash = await bcrypt.hash("demo123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@myduit.my" },
    update: {},
    create: {
      id: uuid(),
      email: "demo@myduit.my",
      username: "demo_user",
      passwordHash,
      firstName: "MyDuit",
      lastName: "Test",
      preferredCurrency: "MYR",
      locale: "en-MY",
      isActive: true,
      isEmailVerified: true,
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Create accounts - Malaysian banks and e-wallets use MYR
  // More balanced distribution across providers
  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        id: uuid(),
        userId: user.id,
        name: "Maybank Savings",
        accountType: AccountType.SAVINGS,
        provider: Provider.BANK,
        accountNumber: "1234567890",
        balance: 8500, // RM 8,500 (~$1,900 USD)
        currency: "MYR",
        isActive: true,
      },
    }),
    prisma.account.create({
      data: {
        id: uuid(),
        userId: user.id,
        name: "RHB Current Account",
        accountType: AccountType.CURRENT,
        provider: Provider.BANK,
        accountNumber: "9876543210",
        balance: 6200, // RM 6,200 (~$1,387 USD)
        currency: "MYR",
        isActive: true,
      },
    }),
    prisma.account.create({
      data: {
        id: uuid(),
        userId: user.id,
        name: "Touch 'n Go eWallet",
        accountType: AccountType.EWALLET,
        provider: Provider.TNG,
        accountNumber: "TNG001",
        balance: 850, // RM 850 (~$190 USD)
        currency: "MYR",
        isActive: true,
      },
    }),
    prisma.account.create({
      data: {
        id: uuid(),
        userId: user.id,
        name: "Grab Wallet",
        accountType: AccountType.EWALLET,
        provider: Provider.GRABPAY,
        accountNumber: "GP001",
        balance: 720, // RM 720 (~$161 USD)
        currency: "MYR",
        isActive: true,
      },
    }),
    prisma.account.create({
      data: {
        id: uuid(),
        userId: user.id,
        name: "Shopee Wallet",
        accountType: AccountType.EWALLET,
        provider: Provider.SHOPEEPAY,
        accountNumber: "SP001",
        balance: 580, // RM 580 (~$130 USD)
        currency: "MYR",
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${accounts.length} accounts`);

  // Use consistent exchange rate derived from shared fallback rates
  // FALLBACK_RATES.MYR = 4.47 (i.e., 4.47 MYR = 1 USD)
  // So 1 MYR = 1 / 4.47 ≈ 0.22371 USD
  const MYR_TO_USD_RATE = 1 / 4.47;

  // Generate transactions for last 6 months with nice distribution
  const now = new Date();
  const transactions: any[] = [];

  // More varied transaction counts per month for realistic patterns
  const monthlyTxCounts = [45, 52, 48, 58, 51, 62]; // Different counts per month (6 months ago to now)

  for (let month = 5; month >= 0; month--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - month, 1);
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() - month + 1,
      0
    ).getDate();

    // Use predefined transaction count for more varied monthly spending
    const txCount = monthlyTxCounts[5 - month];

    for (let i = 0; i < txCount; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const txDate = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        day
      );
      const category =
        CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const merchants = MERCHANTS[category] ?? ["Unknown"];
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];

      // Better distribution across all accounts (not just random)
      let account;
      if (category === TransactionCategory.TRANSPORTATION) {
        // Transportation mostly on Touch N Go or Grab
        account = Math.random() > 0.5 ? accounts[2] : accounts[3]; // TNG or Grab
      } else if (category === TransactionCategory.SHOPPING) {
        // Shopping often on Shopee wallet
        account =
          Math.random() > 0.6
            ? accounts[4]
            : accounts[Math.floor(Math.random() * 2)]; // Shopee or banks
      } else if (category === TransactionCategory.FOOD_DINING) {
        // Food split across e-wallets and banks
        account = accounts[Math.floor(Math.random() * accounts.length)];
      } else {
        // Other categories distributed across all accounts
        account = accounts[Math.floor(Math.random() * accounts.length)];
      }

      // Generate amounts in MYR (Malaysian Ringgit)
      // More realistic and varied Malaysian transaction amounts
      let amountMYR: number;
      switch (category) {
        case TransactionCategory.FOOD_DINING:
          amountMYR = Math.random() * 50 + 10; // RM 10-60 (~$2-13)
          break;
        case TransactionCategory.GROCERIES:
          amountMYR = Math.random() * 120 + 30; // RM 30-150 (~$7-34)
          break;
        case TransactionCategory.TRANSPORTATION:
          amountMYR = Math.random() * 40 + 8; // RM 8-48 (~$2-11)
          break;
        case TransactionCategory.ENTERTAINMENT:
          amountMYR = Math.random() * 80 + 15; // RM 15-95 (~$3-21)
          break;
        case TransactionCategory.SHOPPING:
          amountMYR = Math.random() * 200 + 50; // RM 50-250 (~$11-56)
          break;
        case TransactionCategory.UTILITIES:
          amountMYR = Math.random() * 150 + 50; // RM 50-200 (~$11-45)
          break;
        default:
          amountMYR = Math.random() * 80 + 20; // RM 20-100
      }

      const isEcoFriendly = Math.random() > 0.75;
      const amountRounded = Math.round(amountMYR * 100) / 100;
      const amountInBaseUSD =
        Math.round(amountRounded * MYR_TO_USD_RATE * 100) / 100;

      transactions.push({
        id: uuid(),
        userId: user.id,
        accountId: account.id,
        type: TransactionType.EXPENSE,
        category,
        amount: amountRounded,
        amountInBase: amountInBaseUSD,
        currency: "MYR",
        exchangeRate: MYR_TO_USD_RATE,
        description: `${merchant} purchase`,
        merchantName: merchant,
        isRecurring:
          category === TransactionCategory.UTILITIES ||
          category === TransactionCategory.ENTERTAINMENT,
        isEcoFriendly,
        ecoScore: isEcoFriendly
          ? Math.floor(Math.random() * 30) + 70
          : Math.floor(Math.random() * 40) + 20,
        transactionDate: txDate,
      });
    }

    // Add income transactions per month (in MYR)
    // Salary on 1st, freelance on 15th
    for (let i = 0; i < 2; i++) {
      const day = i === 0 ? 1 : 15;
      const amountMYR = i === 0 ? 7500 : 1200; // RM 7,500 (~$1,678) salary, RM 1,200 (~$268) freelance
      const amountInBaseUSD =
        Math.round(amountMYR * MYR_TO_USD_RATE * 100) / 100;

      transactions.push({
        id: uuid(),
        userId: user.id,
        accountId: accounts[0].id, // Salary goes to Maybank
        type: TransactionType.INCOME,
        category: TransactionCategory.INCOME,
        amount: amountMYR,
        amountInBase: amountInBaseUSD,
        currency: "MYR",
        exchangeRate: MYR_TO_USD_RATE,
        description: i === 0 ? "Monthly Salary" : "Freelance Project Payment",
        merchantName: i === 0 ? "Company ABC Sdn Bhd" : "Freelance Client",
        isRecurring: true,
        isEcoFriendly: false,
        transactionDate: new Date(
          monthStart.getFullYear(),
          monthStart.getMonth(),
          day
        ),
      });
    }
  }

  await prisma.transaction.createMany({ data: transactions });
  console.log(`✅ Created ${transactions.length} transactions`);

  // Create nudge templates
  await prisma.nudge.createMany({
    data: [
      {
        id: uuid(),
        type: "SPENDING_INCREASE",
        title: "Spending Alert",
        messageTemplate: "Your spending is up {{percentage}}% this month",
        severity: "WARNING",
        threshold: 20,
        isActive: true,
        priority: 1,
      },
      {
        id: uuid(),
        type: "ECO_SUGGESTION",
        title: "Go Green!",
        messageTemplate:
          "Only {{percentage}}% of your transactions are eco-friendly",
        severity: "INFO",
        isActive: true,
        priority: 2,
      },
      {
        id: uuid(),
        type: "BUDGET_WARNING",
        title: "Budget Warning",
        messageTemplate:
          "You've spent {{percentage}}% of your typical monthly budget",
        severity: "ALERT",
        threshold: 80,
        isActive: true,
        priority: 1,
      },
    ],
  });

  console.log("✅ Created nudge templates");
  console.log("🎉 Seeding complete!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
