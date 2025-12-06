/**
 * Express Application Entry Point
 * Simplified for development without full DI
 */

import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { logger, convertAmount } from "./shared/index.js";

config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000" }));
app.use(morgan("combined"));
app.use(express.json());

// Health check
app.get("/health", (_, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// Demo Dashboard API (simplified - no DI required)
app.get("/api/v1/dashboard", async (_req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "No user found. Run db:seed first." });
    }

    const baseCurrency = user.preferredCurrency || "USD";
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
    });

    // Convert all account balances to user's preferred currency before summing
    const totalBalance = accounts.reduce((sum, acc) => {
      const convertedBalance = convertAmount(
        acc.balance,
        acc.currency,
        baseCurrency
      );
      return sum + convertedBalance;
    }, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id, transactionDate: { gte: startOfMonth } },
      orderBy: { transactionDate: "desc" },
    });

    // Convert all transactions to user's preferred currency before summing
    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce(
        (sum, t) => sum + convertAmount(t.amount, t.currency, baseCurrency),
        0
      );

    const expenses = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce(
        (sum, t) => sum + convertAmount(t.amount, t.currency, baseCurrency),
        0
      );

    // Category breakdown with currency conversion
    const categoryMap = new Map<string, number>();
    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const convertedAmount = convertAmount(
          t.amount,
          t.currency,
          baseCurrency
        );
        categoryMap.set(
          t.category,
          (categoryMap.get(t.category) ?? 0) + convertedAmount
        );
      });

    const categories = Array.from(categoryMap.entries())
      .map(([category, totalAmount]) => ({
        category,
        totalAmount: { amount: totalAmount, currency: baseCurrency },
        percentage: expenses > 0 ? (totalAmount / expenses) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount.amount - a.totalAmount.amount);

    const ecoFriendlyCount = transactions.filter((t) => t.isEcoFriendly).length;

    res.json({
      success: true,
      data: {
        overview: {
          totalBalance: {
            amount: Math.round(totalBalance * 100) / 100,
            currency: baseCurrency,
          },
          monthlyIncome: {
            amount: Math.round(income * 100) / 100,
            currency: baseCurrency,
          },
          monthlyExpenses: {
            amount: Math.round(expenses * 100) / 100,
            currency: baseCurrency,
          },
          monthlyNetCashFlow: {
            amount: Math.round((income - expenses) * 100) / 100,
            currency: baseCurrency,
          },
          savingsRate:
            income > 0
              ? Math.round(((income - expenses) / income) * 1000) / 10
              : 0,
          accountsCount: accounts.length,
          transactionsCount: transactions.length,
        },
        accounts: accounts.map((a) => {
          // Convert account balance to user's preferred currency for percentage calculation
          const convertedBalance = convertAmount(
            a.balance,
            a.currency,
            baseCurrency
          );
          return {
            id: a.id,
            name: a.name,
            provider: a.provider,
            // Return both original balance and converted balance
            balance: { amount: a.balance, currency: a.currency },
            balanceConverted: {
              amount: Math.round(convertedBalance * 100) / 100,
              currency: baseCurrency,
            },
            percentageOfTotal:
              totalBalance > 0
                ? Math.round((convertedBalance / totalBalance) * 1000) / 10
                : 0,
          };
        }),
        categories,
        sustainability: {
          overall: 62,
          ecoFriendlyCount,
          totalTransactions: transactions.length,
          carbonFootprintEstimate: Math.round(expenses * 0.015 * 10) / 10,
        },
        recentTransactions: transactions.slice(0, 10).map((t) => ({
          id: t.id,
          merchantName: t.merchantName,
          category: t.category,
          amount: { amount: t.amount, currency: t.currency },
          type: t.type,
          date: t.transactionDate,
          isRecurring: t.isRecurring,
          isEcoFriendly: t.isEcoFriendly,
        })),
      },
    });
  } catch (error) {
    logger.error("Dashboard error", { error });
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Transactions list
app.get("/api/v1/transactions", async (req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return res.status(404).json({ success: false, error: "No user found" });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { transactionDate: "desc" },
        take: Number(limit),
        skip,
      }),
      prisma.transaction.count({ where: { userId: user.id } }),
    ]);

    res.json({
      success: true,
      data: {
        transactions: transactions.map((t) => ({
          ...t,
          // Ensure currency is included in the response
          currency: t.currency,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error("Transactions error", { error });
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Accounts list
app.get("/api/v1/accounts", async (_req, res) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return res.status(404).json({ success: false, error: "No user found" });
    }

    const baseCurrency = user.preferredCurrency || "USD";
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Calculate total balance in user's preferred currency
    const totalBalance = accounts.reduce((sum, acc) => {
      return sum + convertAmount(acc.balance, acc.currency, baseCurrency);
    }, 0);

    res.json({
      success: true,
      data: {
        accounts: accounts.map((a) => {
          const convertedBalance = convertAmount(
            a.balance,
            a.currency,
            baseCurrency
          );
          return {
            id: a.id,
            name: a.name,
            provider: a.provider,
            accountType: a.accountType,
            accountNumber: a.accountNumber,
            // Original balance in account's native currency
            balance: { amount: a.balance, currency: a.currency },
            // Converted balance in user's preferred currency
            balanceConverted: {
              amount: Math.round(convertedBalance * 100) / 100,
              currency: baseCurrency,
            },
            percentageOfTotal:
              totalBalance > 0
                ? Math.round((convertedBalance / totalBalance) * 1000) / 10
                : 0,
            isActive: a.isActive,
            lastSyncedAt: a.lastSyncedAt,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
          };
        }),
        totalBalance: {
          amount: Math.round(totalBalance * 100) / 100,
          currency: baseCurrency,
        },
        baseCurrency,
      },
    });
  } catch (error) {
    logger.error("Accounts error", { error });
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Nudges
app.get("/api/v1/dashboard/nudges", async (_req, res) => {
  try {
    const nudges = await prisma.nudge.findMany({ where: { isActive: true } });
    res.json({
      success: true,
      data: {
        nudges: nudges.map((n: any) => ({
          id: n.id,
          type: n.type,
          severity: n.severity,
          title: n.title,
          message: n.messageTemplate,
        })),
        unreadCount: nudges.length,
      },
    });
  } catch (error) {
    logger.error("Nudges error", { error });
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// User Preferences
let userPreferences = {
  currency: "USD",
  enableNudges: true,
  enableSustainability: true,
  darkMode: true,
  locale: "en-MY",
};

app.get("/api/v1/users/me/preferences", (_req, res) => {
  res.json({
    success: true,
    data: userPreferences,
  });
});

app.put("/api/v1/users/me/preferences", (req, res) => {
  try {
    const { currency, enableNudges, enableSustainability, darkMode, locale } =
      req.body;

    if (currency) userPreferences.currency = currency;
    if (enableNudges !== undefined) userPreferences.enableNudges = enableNudges;
    if (enableSustainability !== undefined)
      userPreferences.enableSustainability = enableSustainability;
    if (darkMode !== undefined) userPreferences.darkMode = darkMode;
    if (locale) userPreferences.locale = locale;

    res.json({
      success: true,
      data: userPreferences,
    });
  } catch (error) {
    logger.error("Preferences error", { error });
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// User Profile
let userProfile = {
  id: "1",
  email: "demo@openfinance.my",
  username: "demo_user",
  firstName: "Ahmad",
  lastName: "Rahman",
};

app.get("/api/v1/users/me", (_req, res) => {
  res.json({
    success: true,
    data: userProfile,
  });
});

app.put("/api/v1/users/me", (req, res) => {
  try {
    const { firstName, lastName, email, username } = req.body;

    if (firstName) userProfile.firstName = firstName;
    if (lastName) userProfile.lastName = lastName;
    if (email) userProfile.email = email;
    if (username) userProfile.username = username;

    res.json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    logger.error("Profile update error", { error });
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error("Unhandled error", { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
);

const PORT = process.env.PORT ?? 3001;

const start = async () => {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API available at http://localhost:${PORT}/api/v1`);
      logger.info(`Dashboard: http://localhost:${PORT}/api/v1/dashboard`);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
};

start();

export default app;
