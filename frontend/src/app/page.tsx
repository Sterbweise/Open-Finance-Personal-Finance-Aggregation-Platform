"use client";

import { useState, useEffect } from "react";
import { DashboardOverview } from "@/components/DashboardOverview";
import { SpendingChart } from "@/components/SpendingChart";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { AccountRepartitionChart } from "@/components/AccountRepartitionChart";
import { SmartNudgesWidget } from "@/components/SmartNudgesWidget";
import { TransactionList } from "@/components/TransactionList";
import { AccountsGrid } from "@/components/AccountsGrid";
import { Wallet, RefreshCw, AlertCircle } from "lucide-react";

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data from backend API
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Using Next.js API proxy (configured in next.config.js)
      // This will proxy to http://localhost:3001/api/v1/dashboard
      const response = await fetch("/api/dashboard");

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Transform API data to match component expectations
        const transformedData = {
          overview: {
            totalBalance: result.data.overview.totalBalance || {
              amount: 0,
              currency: "USD",
            },
            monthlyIncome: result.data.overview.monthlyIncome || {
              amount: 0,
              currency: "USD",
            },
            monthlyExpenses: result.data.overview.monthlyExpenses || {
              amount: 0,
              currency: "USD",
            },
            monthlyNetCashFlow: result.data.overview.monthlyNetCashFlow || {
              amount: 0,
              currency: "USD",
            },
            savingsRate: result.data.overview.savingsRate,
            accountsCount: result.data.overview.accountsCount,
            transactionsCount: result.data.overview.transactionsCount,
          },
          accounts: result.data.accounts.map((acc: any) => ({
            id: acc.id,
            name: acc.name,
            provider: acc.provider,
            // Original balance in account's currency
            balance: acc.balance || { amount: 0, currency: "USD" },
            // Converted balance in user's preferred currency
            balanceConverted: acc.balanceConverted ||
              acc.balance || { amount: 0, currency: "USD" },
            percentageOfTotal: acc.percentageOfTotal,
          })),
          categories: result.data.categories || [],
          recentTransactions: result.data.recentTransactions.map((tx: any) => ({
            id: tx.id,
            merchantName: tx.merchantName || "Unknown",
            category: tx.category,
            amount: tx.amount || { amount: 0, currency: "USD" },
            type: tx.type,
            date: tx.date,
            isRecurring: tx.isRecurring,
            isEcoFriendly: tx.isEcoFriendly,
          })),
          // Mock spending trends for now (you can add this to backend later)
          spendingTrends: {
            currentMonth: {
              month: new Date().toISOString().slice(0, 7),
              totalAmount: result.data.overview.monthlyExpenses,
              count: result.data.overview.transactionsCount,
            },
            previousMonth: { month: "2023-12", totalAmount: 2200, count: 38 },
            trend: "increasing",
            percentageChange: 0,
            sixMonthHistory: [
              { month: "2023-08", totalAmount: 1800, count: 32 },
              { month: "2023-09", totalAmount: 2100, count: 35 },
              { month: "2023-10", totalAmount: 1950, count: 33 },
              { month: "2023-11", totalAmount: 2300, count: 40 },
              { month: "2023-12", totalAmount: 2200, count: 38 },
              {
                month: new Date().toISOString().slice(0, 7),
                totalAmount: result.data.overview.monthlyExpenses,
                count: result.data.overview.transactionsCount,
              },
            ],
          },
          nudges: [],
        };

        setData(transformedData);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <RefreshCw
            size={48}
            style={{
              color: "var(--accent-primary)",
              animation: "spin 1s linear infinite",
            }}
          />
          <p
            style={{
              marginTop: "var(--spacing-md)",
              color: "var(--text-secondary)",
            }}
          >
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div
          className="card"
          style={{ maxWidth: "500px", textAlign: "center" }}
        >
          <AlertCircle
            size={48}
            style={{ color: "var(--danger)", margin: "0 auto" }}
          />
          <h2
            style={{ marginTop: "var(--spacing-md)", color: "var(--danger)" }}
          >
            Error Loading Dashboard
          </h2>
          <p
            style={{
              marginTop: "var(--spacing-sm)",
              color: "var(--text-secondary)",
            }}
          >
            {error}
          </p>
          <p
            style={{
              marginTop: "var(--spacing-md)",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
            }}
          >
            Make sure the backend server is running at{" "}
            <code>http://localhost:3001</code>
          </p>
          <button
            onClick={fetchDashboardData}
            style={{
              marginTop: "var(--spacing-lg)",
              padding: "var(--spacing-sm) var(--spacing-lg)",
              background: "var(--accent-gradient)",
              border: "none",
              borderRadius: "var(--radius-md)",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success state - render dashboard
  if (!data) return null;

  return (
    <div style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
      <header className="page-header">
        <div className="page-title">
          <Wallet size={28} className="title-icon" />
          <div>
            <h1>Dashboard</h1>
            <p className="subtitle">Personal Finance Overview</p>
          </div>
        </div>
        <button onClick={fetchDashboardData} className="refresh-btn">
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <div
        className="dashboard-grid"
        style={{ marginBottom: "var(--spacing-xl)" }}
      >
        <DashboardOverview data={data.overview} />
      </div>

      {/* Charts Section */}
      <div
        className="dashboard-grid-main"
        style={{ marginBottom: "var(--spacing-xl)" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-lg)",
          }}
        >
          <SpendingChart data={data.spendingTrends} />
          <CategoryBreakdown data={data.categories} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-lg)",
          }}
        >
          <SmartNudgesWidget
            data={{
              overview: data.overview,
              categories: data.categories,
              accounts: data.accounts,
            }}
          />
          <AccountRepartitionChart accounts={data.accounts} />
        </div>
      </div>

      {/* Accounts Grid */}
      <div
        className="dashboard-grid"
        style={{ marginBottom: "var(--spacing-xl)" }}
      >
        <AccountsGrid accounts={data.accounts} />
      </div>

      <div className="card" style={{ marginBottom: "var(--spacing-xl)" }}>
        <h3 style={{ marginBottom: "var(--spacing-lg)" }}>
          Recent Transactions
        </h3>
        <TransactionList transactions={data.recentTransactions} />
      </div>
    </div>
  );
}
