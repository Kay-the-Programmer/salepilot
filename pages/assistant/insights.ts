/**
 * Business Assistant — insights engine.
 *
 * Reuses the EXISTING data layer (services/api.ts → /sales, /products,
 * /customers, /settings, the same endpoints the main Dashboard loads) and
 * derives the three "bento" insight cards + the greeting summary entirely on
 * the client, so the dashboard never burns the metered /ai/chat quota just to
 * render. The conversational view is what actually calls the AI.
 */
import { api } from '../../services/api';
import type { Product, Sale, Customer, StoreSettings } from '../../types';

export interface CurrencyContext {
  symbol: string;
  code: string;
  position: 'before' | 'after';
}

export interface InsightCard {
  badge: string;
  badgeTone: 'primary' | 'secondary' | 'tertiary';
  title: string;
  body: string;
  cta: string;
  /** Query handed to the assistant when the card's CTA is pressed. */
  prompt: string;
}

export interface BusinessInsights {
  summary: string;
  salesAlert: InsightCard;
  inventoryTip: InsightCard;
  customerNote: InsightCard;
  currency: CurrencyContext;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const formatMoney = (amount: number, c: CurrencyContext): string => {
  const n = (isFinite(amount) ? amount : 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: amount >= 1000 ? 0 : 2,
  });
  return c.position === 'after' ? `${n} ${c.symbol}` : `${c.symbol}${n}`;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const greetingWord = (d = new Date()): string => {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export const currencyFromSettings = (settings: StoreSettings | null): CurrencyContext => ({
  symbol: settings?.currency?.symbol || '$',
  code: settings?.currency?.code || 'USD',
  position: settings?.currency?.position || 'before',
});

/**
 * Pure, synchronous computation of the dashboard insights from data that the
 * host app already has in memory (the main Dashboard loads /products, /sales,
 * /customers, /settings once and passes them down). No network — so embedding
 * the assistant in any app is free.
 */
export function computeInsights(
  products: Product[] = [],
  sales: Sale[] = [],
  customers: Customer[] = [],
  settings: StoreSettings | null = null,
): BusinessInsights {
  const currency = currencyFromSettings(settings);
  return {
    summary: buildSummary(products, sales, customers, currency, settings),
    salesAlert: buildSalesAlert(sales, currency),
    inventoryTip: buildInventoryTip(products, sales, settings),
    customerNote: buildCustomerNote(customers, sales, currency),
    currency,
  };
}

/** Pull the same datasets the main Dashboard uses, tolerating partial failures. */
async function safeGet<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    return (await api.get<T>(endpoint)) ?? fallback;
  } catch (e) {
    console.warn(`[assistant] failed to load ${endpoint}`, e);
    return fallback;
  }
}

/** Fallback used only when the assistant runs without host-provided data. */
export async function fetchBusinessInsights(): Promise<BusinessInsights> {
  const [products, sales, customers, settings] = await Promise.all([
    safeGet<Product[]>('/products', []),
    safeGet<Sale[]>('/sales', []),
    safeGet<Customer[]>('/customers', []),
    safeGet<StoreSettings | null>('/settings', null),
  ]);
  return computeInsights(products, sales, customers, settings);
}

/* ----------------------------- card builders ----------------------------- */

function buildSalesAlert(sales: Sale[], c: CurrencyContext): InsightCard {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * DAY_MS);

  let todayTotal = 0;
  let todayCount = 0;
  let lwTotal = 0;
  for (const s of sales) {
    const t = new Date(s.timestamp);
    if (sameDay(t, now)) {
      todayTotal += s.total || 0;
      todayCount += 1;
    } else if (sameDay(t, lastWeek)) {
      lwTotal += s.total || 0;
    }
  }

  const weekday = WEEKDAYS[now.getDay()];
  let delta: number | null = lwTotal > 0 ? ((todayTotal - lwTotal) / lwTotal) * 100 : null;
  const up = (delta ?? 0) >= 0;

  let body: string;
  if (todayCount === 0) {
    body = `No sales recorded yet today. Last ${weekday} you'd booked ${formatMoney(lwTotal, c)} by now — a good moment to push a promo.`;
  } else if (delta === null) {
    body = `You've taken ${formatMoney(todayTotal, c)} across ${todayCount} sale${todayCount === 1 ? '' : 's'} today.`;
  } else {
    body = `Today's ${formatMoney(todayTotal, c)} from ${todayCount} sale${todayCount === 1 ? '' : 's'} is ${Math.abs(delta).toFixed(0)}% ${up ? 'up on' : 'down from'} last ${weekday}.`;
  }

  return {
    badge: delta === null ? `${todayCount} today` : `${up ? '+' : '−'}${Math.abs(delta).toFixed(0)}% vs LW`,
    badgeTone: 'primary',
    title: 'Sales Alert',
    body,
    cta: 'View Report',
    prompt: "Give me today's sales report compared to last week, with my top products.",
  };
}

function buildInventoryTip(products: Product[], sales: Sale[], settings: StoreSettings | null): InsightCard {
  const defaultReorder = settings?.lowStockThreshold ?? 10;
  const active = products.filter((p) => p.status !== 'archived');

  const lowStock = active
    .filter((p) => (p.stock ?? 0) <= (p.reorderPoint ?? defaultReorder))
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));

  // 7-day unit velocity per product from sale carts.
  const weekAgo = Date.now() - 7 * DAY_MS;
  const velocity = new Map<string, number>();
  for (const s of sales) {
    if (new Date(s.timestamp).getTime() < weekAgo) continue;
    for (const item of s.cart || []) {
      velocity.set(item.productId, (velocity.get(item.productId) || 0) + (item.quantity || 0));
    }
  }

  if (lowStock.length === 0) {
    const topSeller = [...velocity.entries()].sort((a, b) => b[1] - a[1])[0];
    const name = topSeller ? active.find((p) => p.id === topSeller[0])?.name : undefined;
    return {
      badge: 'Healthy',
      badgeTone: 'primary',
      title: 'Inventory Tip',
      body: name
        ? `Stock levels look healthy. "${name}" is your fastest mover this week — keep it well stocked.`
        : 'Stock levels look healthy across your catalogue. No reorders needed right now.',
      cta: 'Review Stock',
      prompt: 'Show me my current inventory health and any items I should reorder soon.',
    };
  }

  // Prefer the low-stock item that's also selling fast (real risk of stockout).
  const ranked = [...lowStock].sort((a, b) => (velocity.get(b.id) || 0) - (velocity.get(a.id) || 0));
  const hot = ranked[0];
  const hotVel = velocity.get(hot.id) || 0;

  const body = hotVel > 0
    ? `"${hot.name}" is down to ${hot.stock} unit${hot.stock === 1 ? '' : 's'} and sold ${hotVel} this week — restock today to avoid an out-of-stock.`
    : `${lowStock.length} item${lowStock.length === 1 ? '' : 's'} are at or below reorder level, lowest being "${hot.name}" (${hot.stock} left).`;

  return {
    badge: 'Low Stock Risk',
    badgeTone: 'secondary',
    title: 'Inventory Tip',
    body,
    cta: 'Order More',
    prompt: `Which products do I need to reorder, and roughly how much of each? Lowest stock is "${hot.name}".`,
  };
}

function buildCustomerNote(customers: Customer[], sales: Sale[], c: CurrencyContext): InsightCard {
  const monthAgo = Date.now() - 30 * DAY_MS;
  const newThisMonth = customers.filter(
    (cu) => cu.createdAt && new Date(cu.createdAt).getTime() >= monthAgo,
  ).length;

  // Top customer by spend.
  const spend = new Map<string, number>();
  for (const s of sales) {
    if (!s.customerId) continue;
    spend.set(s.customerId, (spend.get(s.customerId) || 0) + (s.total || 0));
  }
  const top = [...spend.entries()].sort((a, b) => b[1] - a[1])[0];
  const topName = top ? customers.find((cu) => cu.id === top[0])?.name : undefined;

  let body: string;
  if (topName && top) {
    body = `${topName} is your top customer with ${formatMoney(top[1], c)} in lifetime spend.${
      newThisMonth > 0 ? ` ${newThisMonth} new customer${newThisMonth === 1 ? '' : 's'} joined this month.` : ''
    }`;
  } else if (newThisMonth > 0) {
    body = `${newThisMonth} new customer${newThisMonth === 1 ? '' : 's'} joined this month. A quick welcome offer keeps them coming back.`;
  } else if (customers.length > 0) {
    body = `You have ${customers.length} customer${customers.length === 1 ? '' : 's'} on file. Logging contacts at checkout unlocks loyalty insights.`;
  } else {
    body = 'No customers on file yet. Start capturing contacts at checkout to build loyalty.';
  }

  return {
    badge: newThisMonth > 0 ? `${newThisMonth} new` : 'Loyalty',
    badgeTone: 'tertiary',
    title: 'Customer Note',
    body,
    cta: 'See Insights',
    prompt: 'Give me customer insights — who are my top customers and who is at risk of churning?',
  };
}

function buildSummary(
  products: Product[],
  sales: Sale[],
  customers: Customer[],
  c: CurrencyContext,
  settings: StoreSettings | null,
): string {
  const now = new Date();
  const defaultReorder = settings?.lowStockThreshold ?? 10;

  let todayTotal = 0;
  let todayCount = 0;
  for (const s of sales) {
    if (sameDay(new Date(s.timestamp), now)) {
      todayTotal += s.total || 0;
      todayCount += 1;
    }
  }
  const lowStockCount = products.filter(
    (p) => p.status !== 'archived' && (p.stock ?? 0) <= (p.reorderPoint ?? defaultReorder),
  ).length;
  const newThisMonth = customers.filter(
    (cu) => cu.createdAt && new Date(cu.createdAt).getTime() >= Date.now() - 30 * DAY_MS,
  ).length;

  const parts: string[] = [];
  parts.push(
    todayCount > 0
      ? `You've taken ${formatMoney(todayTotal, c)} across ${todayCount} sale${todayCount === 1 ? '' : 's'} so far today.`
      : `No sales logged yet today — a fresh start.`,
  );
  if (lowStockCount > 0) {
    parts.push(`${lowStockCount} item${lowStockCount === 1 ? '' : 's'} ${lowStockCount === 1 ? 'needs' : 'need'} restocking.`);
  } else if (products.length > 0) {
    parts.push('Stock levels are healthy.');
  }
  if (newThisMonth > 0) {
    parts.push(`${newThisMonth} new customer${newThisMonth === 1 ? '' : 's'} joined this month.`);
  }
  parts.push('Ask me anything below to dig deeper.');
  return parts.join(' ');
}
