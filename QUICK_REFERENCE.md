# Dashboard Widgets - Quick Reference

## 🚀 Getting Started (30 seconds)

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Open: http://localhost:3000
```

---

## 📦 New Components

| Component | File | Purpose |
|-----------|------|---------|
| **AccountRepartitionChart** | `AccountRepartitionChart.tsx` | Pie chart of account balances |
| **CashFlowWidget** | `CashFlowWidget.tsx` | Income vs Expenses flow |
| **SmartNudgesWidget** | `SmartNudgesWidget.tsx` | AI-powered financial insights |
| **CategorySpendingPieChart** | `CategorySpendingPieChart.tsx` | Category spending visualization |

---

## 🎯 Widget Usage

### Account Repartition Chart
```tsx
import { AccountRepartitionChart } from '@/components/AccountRepartitionChart';

<AccountRepartitionChart accounts={data.accounts} />
```

**Props:**
```typescript
accounts: {
  id: string;
  name: string;
  provider: string; // BANK, GRABPAY, TNG, SHOPEEPAY
  balance: { amount: number; currency: string };
}[]
```

---

### Cash Flow Widget
```tsx
import { CashFlowWidget } from '@/components/CashFlowWidget';

<CashFlowWidget
  income={data.overview.monthlyIncome}
  expenses={data.overview.monthlyExpenses}
  netCashFlow={data.overview.monthlyNetCashFlow}
/>
```

**Props:**
```typescript
income: { amount: number; currency: string };
expenses: { amount: number; currency: string };
netCashFlow: { amount: number; currency: string };
```

---

### Smart Nudges Widget
```tsx
import { SmartNudgesWidget } from '@/components/SmartNudgesWidget';

<SmartNudgesWidget data={{
  overview: data.overview,
  categories: data.categories,
  accounts: data.accounts,
}} />
```

**Props:**
```typescript
data: {
  overview: {
    monthlyIncome: { amount: number; currency: string };
    monthlyExpenses: { amount: number; currency: string };
    totalBalance: { amount: number; currency: string };
  };
  categories: { category: string; totalAmount: number; percentage: number; }[];
  accounts: { provider: string; balance: { amount: number; currency: string }; }[];
}
```

---

### Category Spending Pie Chart
```tsx
import { CategorySpendingPieChart } from '@/components/CategorySpendingPieChart';

<CategorySpendingPieChart data={data.categories} />
```

**Props:**
```typescript
data: {
  category: string;
  totalAmount: number;
  count: number;
  percentage: number;
}[]
```

---

## 🔧 Common Tasks

### Add New Widget to Dashboard

1. Create component in `frontend/src/components/YourWidget.tsx`
2. Import in `frontend/src/app/page.tsx`
3. Add to layout:

```tsx
<YourWidget data={data.yourData} />
```

---

### Customize Smart Nudge

Edit `SmartNudgesWidget.tsx`:

```typescript
// Add new nudge type in generateNudges()
nudges.push({
  id: 'your-nudge-id',
  type: 'tip', // 'insight' | 'warning' | 'tip' | 'achievement'
  title: 'Your Title',
  message: 'Your message with data insights',
  icon: YourIcon, // from lucide-react
  color: '#yourColor',
  bgColor: 'rgba(r, g, b, 0.1)',
});
```

---

### Change Widget Colors

Global colors in `frontend/src/app/globals.css`:

```css
:root {
  --accent-primary: #6366f1;
  --success: #22c55e;
  --danger: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;
}
```

---

### Add New Category

Update both components:

1. **CategoryBreakdown.tsx:**
```typescript
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  YOUR_CATEGORY: { 
    label: 'Your Category', 
    color: '#hexColor', 
    bg: 'rgba(r, g, b, 0.15)' 
  },
  // ...
};
```

2. **CategorySpendingPieChart.tsx:**
```typescript
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  YOUR_CATEGORY: { label: 'Your Category', color: '#hexColor' },
  // ...
};
```

---

## 🎨 Styling Quick Tips

### Card Wrapper
```tsx
<div className="card">
  {/* Your content */}
</div>
```

### Two-Column Layout
```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
  gap: 'var(--spacing-lg)',
}}>
  <Widget1 />
  <Widget2 />
</div>
```

### Badge
```tsx
<span className="badge badge-success">Your Text</span>
// badge-primary | badge-success | badge-warning | badge-danger
```

---

## 💱 Currency Conversion

```tsx
import { useExchangeRates } from '@/contexts/SettingsContext';

const { convert, format, currentCurrency } = useExchangeRates();

// Convert
const amountInUSD = convert(100, 'MYR', 'USD');

// Format
const display = format(amountInUSD); // "$22.37"
```

---

## 🧪 Testing Checklist

### Basic Tests:
- [ ] Dashboard loads without errors
- [ ] All widgets render
- [ ] Charts display data
- [ ] Currency conversion works
- [ ] Hover effects work
- [ ] Mobile responsive

### Currency Test:
1. Go to Settings
2. Change currency
3. Verify all amounts update

### Responsive Test:
1. Open DevTools
2. Toggle device toolbar
3. Test on: 
   - Desktop (1920px)
   - Tablet (768px)
   - Mobile (375px)

---

## 🐛 Common Issues

### Charts Not Rendering
**Solution:** Check if Chart.js is installed
```bash
npm install chart.js
```

### Currency Not Converting
**Solution:** Check SettingsContext is wrapping your app
```tsx
// layout.tsx
<SettingsProvider>
  <AppLayout>{children}</AppLayout>
</SettingsProvider>
```

### Data Not Loading
**Solution:** Verify backend is running
```bash
# Check if backend is running on port 3001
curl http://localhost:3001/api/v1/dashboard
```

---

## 📚 Documentation

- **Full Guide:** `DASHBOARD_WIDGETS_GUIDE.md`
- **Summary:** `DASHBOARD_UPDATE_SUMMARY.md`
- **Architecture:** `ARCHITECTURE.md`
- **Shared Types:** `shared/README.md`

---

## 🎯 Key Files

```
frontend/
├── src/
│   ├── app/
│   │   └── page.tsx                    # Main dashboard
│   ├── components/
│   │   ├── AccountRepartitionChart.tsx # NEW
│   │   ├── CashFlowWidget.tsx          # NEW
│   │   ├── SmartNudgesWidget.tsx       # NEW
│   │   ├── CategorySpendingPieChart.tsx# NEW
│   │   ├── DashboardOverview.tsx
│   │   ├── SpendingChart.tsx
│   │   ├── CategoryBreakdown.tsx
│   │   ├── AccountsGrid.tsx
│   │   └── TransactionList.tsx
│   └── contexts/
│       └── SettingsContext.tsx         # Currency conversion
└── package.json
```

---

## 🚀 Deployment

### Production Build
```bash
cd frontend
npm run build
npm start
```

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 💡 Pro Tips

1. **Performance:** Charts auto-destroy on unmount (memory efficient)
2. **Currency:** All amounts auto-convert based on user preference
3. **Responsive:** Use `auto-fit` grids for flexibility
4. **Types:** Import from `shared/types/currency` for consistency
5. **Icons:** Use Lucide React for consistency

---

## 🎉 You're Ready!

Everything you need is here. Start the app and explore the new dashboard!

**Questions?** Check the full documentation files.

**Happy coding! 🚀**

