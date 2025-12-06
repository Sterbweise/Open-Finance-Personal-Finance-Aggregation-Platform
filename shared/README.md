# Shared Types

This directory contains TypeScript types that are shared between the frontend and backend applications.

## Purpose

- **Consistency**: Ensures type definitions are consistent across the entire platform
- **DRY Principle**: Avoid duplicating type definitions
- **Type Safety**: Catch type mismatches between frontend and backend at compile time

## Usage

### In Backend

```typescript
import { Currency, SUPPORTED_CURRENCIES, MoneyValue } from '../../../shared/types';
```

### In Frontend

```typescript
import { Currency, CURRENCY_SYMBOLS, MoneyValue } from '../../../shared/types';
```

## Available Types

### Currency Types
- `Currency` - Union type of supported currency codes
- `CurrencyInfo` - Currency metadata (name, symbol, locale)
- `MoneyValue` - Money amount with currency
- `ExchangeRate` - Exchange rate between two currencies
- `SUPPORTED_CURRENCIES` - Array of all supported currencies
- `CURRENCY_SYMBOLS` - Currency code to symbol mapping
- `FALLBACK_RATES` - Fallback exchange rates when API is unavailable

## Adding New Types

1. Create a new file in `shared/types/` for your type category
2. Export it from `shared/types/index.ts`
3. Update this README with documentation

## Best Practices

1. Keep types pure (no logic, only type definitions and constants)
2. Document all exported types
3. Use meaningful names
4. Group related types together

