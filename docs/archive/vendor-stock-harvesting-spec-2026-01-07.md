# Vendor Stock & Pricing Harvesting System

## Implementation Specification

**Version:** 1.0
**Date:** December 30, 2025
**Status:** Draft
**Companion Documents:** [specification.md](./specification.md), [ui-refocus-spec.md](./ui-refocus-spec.md)

> **UI Integration:** See [ui-refocus-spec.md](./ui-refocus-spec.md) — Vendor stock status surfaces in Parts inventory, BOM pages, and Action Center Dashboard alerts.

---

## Executive Summary

This document specifies the vendor catalog and product data system for BuildSeason. The primary goal is **minimizing data entry friction** — paste a link, get all product details automatically.

**Philosophy: On-Demand First, Monitoring Later**

Rather than heavy upfront scraping of vendor catalogs, we take an on-demand approach:

1. User pastes a product URL → system extracts SKU, name, price, image, stock status
2. Part referenced in OnShape BOM → system fetches details automatically
3. Cross-team caching → if Team A fetches a goBILDA part, Team B benefits from cached data
4. Intelligent refresh → check stock/price when part is actively being ordered or is on a BOM

**Key Design Decisions:**

- **Link-drop intake** — Paste a product URL, system auto-extracts all details
- **Cross-team caching** — Vendor catalog items shared across all teams
- **Schema.org extraction** — Leverage structured data (JSON-LD) when available (most Shopify stores)
- **Direct API partnerships** — Work with goBILDA, REV for official data feeds (in progress)
- **Lazy refresh** — Check stock/price on-demand, not scheduled scraping
- **Temporal.io** — For async extraction jobs and future monitoring workflows

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Vendor Tiers & Strategies](#2-vendor-tiers--strategies)
3. [Architecture Overview](#3-architecture-overview)
4. [Temporal Workflows](#4-temporal-workflows)
5. [Data Extraction Strategies](#5-data-extraction-strategies)
6. [URL-Based Part Intake](#6-url-based-part-intake)
7. [Database Schema Extensions](#7-database-schema-extensions)
8. [Implementation Phases](#8-implementation-phases)
9. [API Reference](#9-api-reference)
10. [Monitoring & Alerts](#10-monitoring--alerts)

---

## 1. Problem Statement

### Current Pain Points

1. **Manual Price Tracking**: Teams manually check vendor websites for current prices
2. **Stock Surprises**: Parts go out-of-stock without warning, delaying builds
3. **Lead Time Uncertainty**: No visibility into actual shipping times during peak season
4. **Data Entry Tedium**: Adding parts requires typing SKU, name, price manually
5. **Stale Information**: Cached prices become outdated, leading to budget miscalculations

### Desired Outcome

- Real-time awareness of stock status for parts teams care about
- Proactive alerts when prices change or items go out-of-stock
- Minimal friction when adding new parts (paste URL → done)
- Community intelligence on actual vs. advertised lead times

---

## 2. Vendor Tiers & Strategies

### Tier 1: Core FTC/FRC Vendors (API Partnership Target)

These vendors represent 80%+ of typical team purchases. We're pursuing direct API partnerships for official data.

| Vendor       | Website         | Extraction Method | API Status              |
| ------------ | --------------- | ----------------- | ----------------------- |
| REV Robotics | revrobotics.com | Schema.org + API  | Partnership in progress |
| goBILDA      | gobilda.com     | Schema.org + API  | Partnership in progress |
| AndyMark     | andymark.com    | Schema.org        | On-demand extraction    |
| ServoCity    | servocity.com   | Schema.org        | On-demand extraction    |

**Strategy:**

- On-demand extraction when user pastes link or OnShape references part
- Cross-team caching (vendor catalog items are global)
- Direct API integration when partnerships are established
- Lazy refresh: re-fetch when part is on active order or BOM

### Tier 2: Electronics & Components (On-Demand)

| Vendor   | Website      | Extraction Method        |
| -------- | ------------ | ------------------------ |
| SparkFun | sparkfun.com | Schema.org (Shopify)     |
| Adafruit | adafruit.com | Schema.org (Shopify)     |
| Pololu   | pololu.com   | Schema.org               |
| DigiKey  | digikey.com  | On-demand, API available |
| Mouser   | mouser.com   | On-demand, API available |

### Tier 3: General Suppliers (On-Demand)

| Vendor        | Website       | Extraction Method       | Notes                             |
| ------------- | ------------- | ----------------------- | --------------------------------- |
| McMaster-Carr | mcmaster.com  | Official API            | Requires approved customer status |
| Amazon        | amazon.com    | Product Advertising API | Rate limited                      |
| Home Depot    | homedepot.com | Schema.org              | On-demand only                    |

**All tiers use on-demand extraction** — no scheduled crawling until we have API partnerships or clear need.

**McMaster-Carr API Details:**

- Official API available at https://www.mcmaster.com/help/api/
- Requires approved customer status
- Provides product specs, pricing, availability
- Uses client certificate authentication
- Base URL: `https://api.mcmaster.com/v1/`

### Tier 4: International Vendors (Phase 3)

| Vendor          | Region | Website        |
| --------------- | ------ | -------------- |
| The Robot Space | UK/EU  | therobot.space |
| RobotShop       | Global | robotshop.com  |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Stock Harvesting System                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      Temporal Cloud / Self-Hosted                   │ │
│  │                                                                      │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │ │
│  │  │  Catalog Sync    │  │  Stock Monitor   │  │  Price Alert     │  │ │
│  │  │  Workflow        │  │  Workflow        │  │  Workflow        │  │ │
│  │  │  (Nightly)       │  │  (Every 6h)      │  │  (On change)     │  │ │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │ │
│  │           │                     │                     │             │ │
│  │           └─────────────────────┼─────────────────────┘             │ │
│  │                                 │                                    │ │
│  └─────────────────────────────────┼────────────────────────────────────┘ │
│                                    │                                      │
│                                    ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                         Activity Workers                            │  │
│  │                                                                      │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │  │
│  │  │  Playwright    │  │  API Client    │  │  Data Parser   │        │  │
│  │  │  Browser Pool  │  │  (McMaster,    │  │  (JSON-LD,     │        │  │
│  │  │                │  │   Shopify)     │  │   HTML, XPath) │        │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘        │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                    │                                      │
│                                    ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │                            Turso Database                             ││
│  │                                                                       ││
│  │  vendorCatalogItems │ priceHistory │ stockAlerts │ harvestLogs       ││
│  └──────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component          | Technology     | Rationale                                      |
| ------------------ | -------------- | ---------------------------------------------- |
| Workflow Engine    | Temporal.io    | Durable execution, scheduling, visibility      |
| Browser Automation | Playwright     | Better reliability than Puppeteer (96% vs 75%) |
| API Client         | Native fetch   | For vendors with APIs                          |
| Database           | Turso (SQLite) | Existing stack, good performance               |
| Queue/Cache        | None (Phase 1) | Temporal handles state                         |

### Temporal Deployment Options

**Option A: Temporal Cloud (Recommended for Phase 1)**

- Zero ops burden
- Consumption-based pricing
- $6,000 startup credits available
- Actions Per Second (APS) scaling

**Option B: Self-Hosted on Fly.io**

- Lower cost at scale
- More operational complexity
- Requires PostgreSQL/MySQL + 4 services
- Use `temporalio/docker-compose` for setup

---

## 4. Temporal Workflows

### 4.1 Catalog Sync Workflow

Runs nightly to discover new products, discontinued items, and maintain catalog freshness.

```typescript
// workflows/catalogSync.ts
import { proxyActivities, sleep } from "@temporalio/workflow";
import type * as activities from "../activities/catalog";

const {
  fetchVendorSitemap,
  scrapeProductPage,
  upsertCatalogItem,
  markDiscontinued,
  notifyNewProducts,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "5 minutes",
  retry: {
    initialInterval: "10 seconds",
    backoffCoefficient: 2,
    maximumInterval: "5 minutes",
    maximumAttempts: 3,
  },
});

export async function catalogSyncWorkflow(
  vendorId: string
): Promise<CatalogSyncResult> {
  const stats = { added: 0, updated: 0, discontinued: 0 };

  // Fetch all product URLs from vendor
  const productUrls = await fetchVendorSitemap(vendorId);

  // Process in batches to avoid overwhelming vendor
  const BATCH_SIZE = 10;
  const BATCH_DELAY = "30 seconds";

  for (let i = 0; i < productUrls.length; i += BATCH_SIZE) {
    const batch = productUrls.slice(i, i + BATCH_SIZE);

    // Scrape batch in parallel
    const results = await Promise.all(
      batch.map((url) => scrapeProductPage(vendorId, url))
    );

    // Update database
    for (const product of results.filter(Boolean)) {
      const action = await upsertCatalogItem(vendorId, product);
      stats[action]++;
    }

    // Rate limit: wait between batches
    if (i + BATCH_SIZE < productUrls.length) {
      await sleep(BATCH_DELAY);
    }
  }

  // Mark products not seen as discontinued
  stats.discontinued = await markDiscontinued(vendorId);

  // Notify if significant new products found
  if (stats.added > 5) {
    await notifyNewProducts(vendorId, stats.added);
  }

  return stats;
}
```

### 4.2 Stock Monitor Workflow

Checks stock and pricing for high-priority items on a schedule.

```typescript
// workflows/stockMonitor.ts
import {
  proxyActivities,
  defineSignal,
  setHandler,
  condition,
} from "@temporalio/workflow";

const {
  getWatchedItems,
  checkItemStock,
  recordPriceChange,
  recordStockChange,
  sendStockAlert,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "2 minutes",
  retry: {
    initialInterval: "5 seconds",
    backoffCoefficient: 2,
    maximumInterval: "1 minute",
    maximumAttempts: 5,
  },
});

// Signal to force immediate check
export const forceCheckSignal = defineSignal<[string]>("forceCheck");

export async function stockMonitorWorkflow(vendorId: string): Promise<void> {
  let forceCheckSku: string | null = null;

  setHandler(forceCheckSignal, (sku: string) => {
    forceCheckSku = sku;
  });

  // Get items being watched by teams (on BOMs, orders, or explicitly watched)
  const watchedItems = await getWatchedItems(vendorId);

  // Check items based on priority
  for (const item of watchedItems) {
    const current = await checkItemStock(vendorId, item.sku);

    // Detect price changes
    if (current.priceCents !== item.lastPriceCents) {
      await recordPriceChange(item.id, current.priceCents, item.lastPriceCents);

      // Alert if price increased significantly (>10%)
      if (current.priceCents > item.lastPriceCents * 1.1) {
        await sendStockAlert({
          type: "price_increase",
          item,
          oldPrice: item.lastPriceCents,
          newPrice: current.priceCents,
        });
      }
    }

    // Detect stock changes
    if (current.inStock !== item.lastInStock) {
      await recordStockChange(item.id, current.inStock, current.stockLevel);

      // Alert on out-of-stock for watched items
      if (!current.inStock && item.isWatched) {
        await sendStockAlert({
          type: "out_of_stock",
          item,
          estimatedRestock: current.estimatedRestock,
        });
      }

      // Alert on back-in-stock
      if (current.inStock && !item.lastInStock) {
        await sendStockAlert({
          type: "back_in_stock",
          item,
        });
      }
    }
  }
}
```

### 4.3 URL Import Workflow

Handles the "paste a URL, get full product details" flow.

```typescript
// workflows/urlImport.ts
export async function urlImportWorkflow(
  url: string,
  teamId: string,
  requestedBy: string
): Promise<ImportResult> {
  // Identify vendor from URL
  const vendor = await identifyVendor(url);

  if (!vendor) {
    return {
      success: false,
      error:
        "Unknown vendor. Supported: REV, goBILDA, AndyMark, McMaster-Carr, etc.",
    };
  }

  // Check if we already have this in catalog
  const existing = await findInCatalog(vendor.id, url);

  if (existing) {
    // Refresh data but use cached structure
    const refreshed = await refreshCatalogItem(existing.id);
    return {
      success: true,
      product: refreshed,
      source: "catalog",
    };
  }

  // Scrape the product page
  const scraped = await scrapeProductPage(vendor.id, url);

  if (!scraped) {
    return {
      success: false,
      error: "Could not extract product data from URL",
    };
  }

  // Add to catalog for future reference
  await upsertCatalogItem(vendor.id, scraped);

  // Optionally add to team's parts inventory
  if (scraped.sku) {
    await createTeamPart(teamId, {
      vendorId: vendor.id,
      name: scraped.name,
      sku: scraped.sku,
      description: scraped.description,
      unitPriceCents: scraped.priceCents,
      imageUrl: scraped.imageUrl,
      createdBy: requestedBy,
    });
  }

  return {
    success: true,
    product: scraped,
    source: "scraped",
  };
}
```

### 4.4 Schedule Configuration

```typescript
// worker/schedules.ts
import { Client, ScheduleClient } from "@temporalio/client";

export async function setupSchedules(client: Client) {
  const scheduleClient = new ScheduleClient(client.connection);

  // Tier 1 vendors: Catalog sync nightly at 3 AM
  const tier1Vendors = ["rev-robotics", "gobilda", "andymark", "servocity"];

  for (const vendorId of tier1Vendors) {
    await scheduleClient.create({
      scheduleId: `catalog-sync-${vendorId}`,
      spec: {
        cronExpressions: ["0 3 * * *"], // 3 AM daily
      },
      action: {
        type: "startWorkflow",
        workflowType: "catalogSyncWorkflow",
        args: [vendorId],
        taskQueue: "stock-harvesting",
      },
    });
  }

  // Tier 1 vendors: Stock monitoring every 6 hours
  for (const vendorId of tier1Vendors) {
    await scheduleClient.create({
      scheduleId: `stock-monitor-${vendorId}`,
      spec: {
        cronExpressions: ["0 */6 * * *"], // Every 6 hours
      },
      action: {
        type: "startWorkflow",
        workflowType: "stockMonitorWorkflow",
        args: [vendorId],
        taskQueue: "stock-harvesting",
      },
    });
  }

  // Tier 2 vendors: Less frequent
  const tier2Vendors = ["sparkfun", "adafruit", "pololu"];

  for (const vendorId of tier2Vendors) {
    await scheduleClient.create({
      scheduleId: `stock-monitor-${vendorId}`,
      spec: {
        cronExpressions: ["0 */12 * * *"], // Every 12 hours
      },
      action: {
        type: "startWorkflow",
        workflowType: "stockMonitorWorkflow",
        args: [vendorId],
        taskQueue: "stock-harvesting",
      },
    });
  }
}
```

---

## 5. Data Extraction Strategies

### 5.1 Schema.org JSON-LD (Preferred)

Most e-commerce sites include structured data for SEO. This is the cleanest extraction method.

```typescript
// activities/extractors/jsonld.ts
import { Page } from "playwright";

interface ProductSchema {
  "@type": "Product";
  name: string;
  sku?: string;
  image?: string | string[];
  description?: string;
  offers?:
    | {
        "@type": "Offer" | "AggregateOffer";
        price: number | string;
        priceCurrency: string;
        availability: string;
        itemCondition?: string;
      }
    | Array<{
        "@type": "Offer";
        price: number | string;
        priceCurrency: string;
        availability: string;
      }>;
}

export async function extractJsonLd(page: Page): Promise<ProductSchema | null> {
  const scripts = await page.$$('script[type="application/ld+json"]');

  for (const script of scripts) {
    const content = await script.textContent();
    if (!content) continue;

    try {
      const data = JSON.parse(content);

      // Handle @graph structure
      const items = data["@graph"] || [data];

      for (const item of items) {
        if (item["@type"] === "Product") {
          return item as ProductSchema;
        }
      }
    } catch (e) {
      // Invalid JSON, continue
    }
  }

  return null;
}

export function parseAvailability(availability: string): {
  inStock: boolean;
  stockLevel: "in-stock" | "low-stock" | "out-of-stock" | "discontinued";
} {
  const normalized = availability.toLowerCase();

  if (normalized.includes("instock") || normalized.includes("in_stock")) {
    return { inStock: true, stockLevel: "in-stock" };
  }
  if (
    normalized.includes("limitedavailability") ||
    normalized.includes("lowstock")
  ) {
    return { inStock: true, stockLevel: "low-stock" };
  }
  if (
    normalized.includes("outofstock") ||
    normalized.includes("out_of_stock")
  ) {
    return { inStock: false, stockLevel: "out-of-stock" };
  }
  if (normalized.includes("discontinued")) {
    return { inStock: false, stockLevel: "discontinued" };
  }

  // Default to in-stock if unrecognized
  return { inStock: true, stockLevel: "in-stock" };
}
```

### 5.2 Vendor-Specific Extractors

When JSON-LD is incomplete or unavailable, use vendor-specific selectors.

```typescript
// activities/extractors/vendors/rev-robotics.ts
import { Page } from "playwright";

export async function extractRevRoboticsProduct(page: Page, url: string) {
  // REV uses a standard Shopify-like structure

  // Wait for product content to load
  await page.waitForSelector(".product-single__title", { timeout: 10000 });

  const name = await page.$eval(".product-single__title", (el) =>
    el.textContent?.trim()
  );

  // SKU is in the URL pattern: /rev-XX-XXXX/
  const skuMatch = url.match(/\/rev-(\d{2}-\d{4})\/?/i);
  const sku = skuMatch ? `REV-${skuMatch[1]}` : null;

  // Price
  const priceText = await page.$eval(".product__price", (el) =>
    el.textContent?.trim()
  );
  const priceCents = parsePriceToCents(priceText);

  // Stock status
  const addToCartButton = await page.$(".product-form__add-button");
  const buttonText = await addToCartButton?.textContent();
  const inStock = buttonText?.toLowerCase().includes("add to cart") ?? false;

  // Image
  const imageUrl = await page.$eval(".product-single__photo img", (el) =>
    el.getAttribute("src")
  );

  // Description
  const description = await page.$eval(".product-single__description", (el) =>
    el.textContent?.trim()
  );

  return {
    name,
    sku,
    priceCents,
    inStock,
    stockLevel: inStock ? "in-stock" : "out-of-stock",
    imageUrl,
    description,
    productUrl: url,
  };
}
```

```typescript
// activities/extractors/vendors/gobilda.ts
import { Page } from "playwright";

export async function extractGoBildaProduct(page: Page, url: string) {
  // goBILDA uses BigCommerce

  await page.waitForSelector(".productView-title", { timeout: 10000 });

  const name = await page.$eval(".productView-title", (el) =>
    el.textContent?.trim()
  );

  // SKU from page
  const sku = await page.$eval(
    ".productView-info-value[data-product-sku]",
    (el) => el.textContent?.trim()
  );

  // Price (handle sale prices)
  const priceText = await page.$eval(
    ".productView-price .price--withoutTax",
    (el) => el.textContent?.trim()
  );
  const priceCents = parsePriceToCents(priceText);

  // Stock
  const stockText = await page.$eval(
    ".productView-info-value[data-product-stock]",
    (el) => el.textContent?.trim()
  );
  const inStock = !stockText?.toLowerCase().includes("out of stock");

  return {
    name,
    sku,
    priceCents,
    inStock,
    stockLevel: inStock ? "in-stock" : "out-of-stock",
    productUrl: url,
  };
}
```

### 5.3 McMaster-Carr API Integration

```typescript
// activities/extractors/vendors/mcmaster.ts
import { createClient, ClientCertificateCredential } from "./mcmaster-client";

export async function fetchMcMasterProduct(partNumber: string) {
  const client = createClient({
    baseUrl: "https://api.mcmaster.com/v1/",
    credential: new ClientCertificateCredential(
      process.env.MCMASTER_CERT_PATH!,
      process.env.MCMASTER_KEY_PATH!
    ),
  });

  const product = await client.getProduct(partNumber);

  return {
    name: product.shortDescription,
    sku: product.partNumber,
    description: product.longDescription,
    priceCents: Math.round(product.price * 100),
    inStock: product.availability === "IN_STOCK",
    stockLevel: mapAvailability(product.availability),
    leadTimeDays: product.leadTimeDays,
    specs: product.specifications,
    imageUrl: product.imageUrl,
    productUrl: `https://www.mcmaster.com/${partNumber}`,
  };
}
```

### 5.4 Browser Pool Management

```typescript
// activities/browser/pool.ts
import { chromium, Browser, BrowserContext } from "playwright";

class BrowserPool {
  private browsers: Browser[] = [];
  private contexts: Map<string, BrowserContext> = new Map();
  private maxBrowsers = 3;
  private contextsPerBrowser = 5;

  async getContext(vendorId: string): Promise<BrowserContext> {
    // Check for existing context
    if (this.contexts.has(vendorId)) {
      return this.contexts.get(vendorId)!;
    }

    // Get or create browser
    let browser = this.browsers.find(
      (b) => this.getContextCount(b) < this.contextsPerBrowser
    );

    if (!browser && this.browsers.length < this.maxBrowsers) {
      browser = await chromium.launch({
        headless: true,
        args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
      });
      this.browsers.push(browser);
    }

    if (!browser) {
      throw new Error("Browser pool exhausted");
    }

    // Create context with stealth settings
    const context = await browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
      timezoneId: "America/New_York",
    });

    // Add stealth scripts
    await context.addInitScript(() => {
      // Hide webdriver
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      // Mock plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    this.contexts.set(vendorId, context);
    return context;
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  async cleanup(): Promise<void> {
    for (const [_, context] of this.contexts) {
      await context.close();
    }
    for (const browser of this.browsers) {
      await browser.close();
    }
  }
}

export const browserPool = new BrowserPool();
```

---

## 6. URL-Based Part Intake

### 6.1 URL Pattern Recognition

```typescript
// lib/vendors/patterns.ts
export interface VendorPattern {
  id: string;
  name: string;
  urlPatterns: RegExp[];
  skuExtractor: (url: string) => string | null;
  tier: 1 | 2 | 3 | 4;
}

export const vendorPatterns: VendorPattern[] = [
  {
    id: "rev-robotics",
    name: "REV Robotics",
    urlPatterns: [/^https?:\/\/(www\.)?revrobotics\.com\//],
    skuExtractor: (url) => {
      const match = url.match(/\/rev-(\d{2}-\d{4})/i);
      return match ? `REV-${match[1]}` : null;
    },
    tier: 1,
  },
  {
    id: "gobilda",
    name: "goBILDA",
    urlPatterns: [/^https?:\/\/(www\.)?gobilda\.com\//],
    skuExtractor: (url) => {
      // goBILDA uses product names in URL, SKU is on page
      return null;
    },
    tier: 1,
  },
  {
    id: "andymark",
    name: "AndyMark",
    urlPatterns: [/^https?:\/\/(www\.)?andymark\.com\//],
    skuExtractor: (url) => {
      const match = url.match(/\/products\/am-\d+/i);
      return match ? match[0].replace("/products/", "").toUpperCase() : null;
    },
    tier: 1,
  },
  {
    id: "mcmaster",
    name: "McMaster-Carr",
    urlPatterns: [/^https?:\/\/(www\.)?mcmaster\.com\//],
    skuExtractor: (url) => {
      // McMaster URLs end with part number
      const match = url.match(/\/(\d{4,}[A-Z]\d+)$/);
      return match ? match[1] : null;
    },
    tier: 3,
  },
  {
    id: "amazon",
    name: "Amazon",
    urlPatterns: [
      /^https?:\/\/(www\.)?amazon\.com\//,
      /^https?:\/\/amzn\.(to|com)\//,
    ],
    skuExtractor: (url) => {
      const match = url.match(/\/dp\/([A-Z0-9]{10})/);
      return match ? match[1] : null;
    },
    tier: 3,
  },
];

export function identifyVendorFromUrl(url: string): VendorPattern | null {
  for (const vendor of vendorPatterns) {
    for (const pattern of vendor.urlPatterns) {
      if (pattern.test(url)) {
        return vendor;
      }
    }
  }
  return null;
}
```

### 6.2 API Endpoint

```typescript
// routes/api/parts/import.ts
import { Hono } from "hono";
import { z } from "zod";
import { temporal } from "../../../lib/temporal";

const app = new Hono();

const importSchema = z.object({
  url: z.string().url(),
  addToInventory: z.boolean().default(false),
  quantity: z.number().int().positive().optional(),
});

app.post("/import-from-url", async (c) => {
  const teamId = c.get("teamId");
  const userId = c.get("userId");

  const body = await c.req.json();
  const { url, addToInventory, quantity } = importSchema.parse(body);

  // Start workflow
  const handle = await temporal.workflow.start("urlImportWorkflow", {
    args: [url, teamId, userId],
    taskQueue: "stock-harvesting",
    workflowId: `url-import-${Date.now()}-${teamId}`,
  });

  // Wait for result (with timeout)
  const result = await handle.result({ timeout: "30 seconds" });

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  // Optionally add to team inventory
  if (addToInventory && result.product) {
    const part = await db
      .insert(parts)
      .values({
        id: generateId(),
        teamId,
        vendorId: result.product.vendorId,
        name: result.product.name,
        sku: result.product.sku,
        description: result.product.description,
        quantity: quantity ?? 0,
        unitPriceCents: result.product.priceCents,
        imageUrl: result.product.imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return c.json({
      success: true,
      product: result.product,
      part: part[0],
    });
  }

  return c.json({
    success: true,
    product: result.product,
  });
});

export default app;
```

### 6.3 Frontend Integration

```typescript
// components/parts/UrlImportDialog.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function UrlImportDialog({ teamId, onSuccess }: Props) {
  const [url, setUrl] = useState('');
  const [addToInventory, setAddToInventory] = useState(true);

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await api.teams[':teamId'].parts['import-from-url'].$post({
        param: { teamId },
        json: { url, addToInventory },
      });
      return res.json();
    },
    onSuccess: (data) => {
      onSuccess(data.product);
    },
  });

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Part from URL</DialogTitle>
          <DialogDescription>
            Paste a product link from REV, goBILDA, AndyMark, McMaster-Carr,
            or other supported vendors.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="https://www.revrobotics.com/rev-41-1301/"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Checkbox
              checked={addToInventory}
              onCheckedChange={setAddToInventory}
            />
            <Label>Add to team inventory</Label>
          </div>

          {importMutation.isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching product details...
            </div>
          )}

          {importMutation.error && (
            <Alert variant="destructive">
              {importMutation.error.message}
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={!url || importMutation.isLoading}
          >
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 7. Database Schema Extensions

```sql
-- Vendor catalog items (synced from vendor websites)
CREATE TABLE vendor_catalog_items (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,

  -- Pricing
  price_cents INTEGER NOT NULL,
  original_price_cents INTEGER,  -- If on sale
  price_currency TEXT DEFAULT 'USD',

  -- Stock
  in_stock INTEGER NOT NULL DEFAULT 1,  -- boolean
  stock_level TEXT CHECK (stock_level IN ('in-stock', 'low-stock', 'out-of-stock', 'discontinued')),
  lead_time_days INTEGER,

  -- Media
  image_url TEXT,
  product_url TEXT NOT NULL,

  -- Metadata
  specs TEXT,  -- JSON
  related_skus TEXT,  -- JSON array

  -- Sync tracking
  last_scraped_at INTEGER NOT NULL,
  scrape_success INTEGER DEFAULT 1,  -- boolean
  scrape_error TEXT,

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  UNIQUE(vendor_id, sku)
);

-- Price history for tracking changes
CREATE TABLE price_history (
  id TEXT PRIMARY KEY,
  catalog_item_id TEXT NOT NULL REFERENCES vendor_catalog_items(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL,
  original_price_cents INTEGER,
  recorded_at INTEGER NOT NULL
);

CREATE INDEX idx_price_history_item ON price_history(catalog_item_id, recorded_at DESC);

-- Stock change history
CREATE TABLE stock_history (
  id TEXT PRIMARY KEY,
  catalog_item_id TEXT NOT NULL REFERENCES vendor_catalog_items(id) ON DELETE CASCADE,
  in_stock INTEGER NOT NULL,  -- boolean
  stock_level TEXT,
  lead_time_days INTEGER,
  recorded_at INTEGER NOT NULL
);

CREATE INDEX idx_stock_history_item ON stock_history(catalog_item_id, recorded_at DESC);

-- Team watch list (items teams want notifications about)
CREATE TABLE watched_items (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,  -- FK to teams
  catalog_item_id TEXT NOT NULL REFERENCES vendor_catalog_items(id) ON DELETE CASCADE,

  -- Watch preferences
  notify_price_drop INTEGER DEFAULT 1,  -- boolean
  notify_price_increase INTEGER DEFAULT 0,  -- boolean
  notify_back_in_stock INTEGER DEFAULT 1,  -- boolean
  notify_low_stock INTEGER DEFAULT 1,  -- boolean
  price_threshold_cents INTEGER,  -- Alert if price drops below this

  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,

  UNIQUE(team_id, catalog_item_id)
);

-- Harvest job logs for debugging
CREATE TABLE harvest_logs (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  workflow_type TEXT NOT NULL,  -- 'catalog_sync', 'stock_monitor', 'url_import'
  workflow_id TEXT NOT NULL,

  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  items_processed INTEGER DEFAULT 0,
  items_added INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,

  error_message TEXT,

  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  duration_ms INTEGER
);

CREATE INDEX idx_harvest_logs_vendor ON harvest_logs(vendor_id, started_at DESC);

-- Update vendors table to support harvesting configuration
ALTER TABLE vendors ADD COLUMN harvest_enabled INTEGER DEFAULT 0;  -- boolean
ALTER TABLE vendors ADD COLUMN harvest_tier INTEGER;  -- 1, 2, 3, 4
ALTER TABLE vendors ADD COLUMN sitemap_url TEXT;
ALTER TABLE vendors ADD COLUMN api_type TEXT;  -- 'shopify', 'mcmaster', 'custom', null
ALTER TABLE vendors ADD COLUMN api_credentials TEXT;  -- Encrypted JSON
ALTER TABLE vendors ADD COLUMN last_harvest_at INTEGER;
ALTER TABLE vendors ADD COLUMN harvest_error TEXT;
```

### Drizzle Schema

```typescript
// db/schema/catalog.ts
import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { vendors, teams, users } from "./core";

export const vendorCatalogItems = sqliteTable(
  "vendor_catalog_items",
  {
    id: text("id").primaryKey(),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),

    priceCents: integer("price_cents").notNull(),
    originalPriceCents: integer("original_price_cents"),
    priceCurrency: text("price_currency").default("USD"),

    inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
    stockLevel: text("stock_level").$type<
      "in-stock" | "low-stock" | "out-of-stock" | "discontinued"
    >(),
    leadTimeDays: integer("lead_time_days"),

    imageUrl: text("image_url"),
    productUrl: text("product_url").notNull(),

    specs: text("specs", { mode: "json" }),
    relatedSkus: text("related_skus", { mode: "json" }).$type<string[]>(),

    lastScrapedAt: integer("last_scraped_at", { mode: "timestamp" }).notNull(),
    scrapeSuccess: integer("scrape_success", { mode: "boolean" }).default(true),
    scrapeError: text("scrape_error"),

    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    vendorSkuUnique: unique().on(table.vendorId, table.sku),
  })
);

export const priceHistory = sqliteTable("price_history", {
  id: text("id").primaryKey(),
  catalogItemId: text("catalog_item_id")
    .notNull()
    .references(() => vendorCatalogItems.id, { onDelete: "cascade" }),
  priceCents: integer("price_cents").notNull(),
  originalPriceCents: integer("original_price_cents"),
  recordedAt: integer("recorded_at", { mode: "timestamp" }).notNull(),
});

export const watchedItems = sqliteTable(
  "watched_items",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    catalogItemId: text("catalog_item_id")
      .notNull()
      .references(() => vendorCatalogItems.id, { onDelete: "cascade" }),

    notifyPriceDrop: integer("notify_price_drop", { mode: "boolean" }).default(
      true
    ),
    notifyPriceIncrease: integer("notify_price_increase", {
      mode: "boolean",
    }).default(false),
    notifyBackInStock: integer("notify_back_in_stock", {
      mode: "boolean",
    }).default(true),
    notifyLowStock: integer("notify_low_stock", { mode: "boolean" }).default(
      true
    ),
    priceThresholdCents: integer("price_threshold_cents"),

    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    teamItemUnique: unique().on(table.teamId, table.catalogItemId),
  })
);
```

---

## 8. Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

**Goals:**

- Temporal worker setup (Cloud or self-hosted)
- URL import workflow for top 4 vendors
- Basic catalog sync for REV Robotics

**Deliverables:**

- [ ] Temporal SDK integration in API
- [ ] Worker process with Playwright browser pool
- [ ] JSON-LD extractor
- [ ] REV Robotics vendor-specific extractor
- [ ] `/api/parts/import-from-url` endpoint
- [ ] Database schema migration
- [ ] Basic UI for URL import

**Success Criteria:**

- Can paste REV Robotics URL and get product details
- Product is added to team inventory with correct price/SKU

### Phase 2: Tier 1 Vendors (Week 3-4)

**Goals:**

- Full catalog sync for goBILDA, AndyMark, ServoCity
- Scheduled stock monitoring
- Price/stock change detection

**Deliverables:**

- [ ] goBILDA extractor
- [ ] AndyMark extractor
- [ ] ServoCity extractor
- [ ] Catalog sync workflow with sitemap parsing
- [ ] Stock monitor workflow
- [ ] Schedule configuration
- [ ] Discord notifications for stock alerts
- [ ] Price history tracking

**Success Criteria:**

- Nightly catalog sync runs successfully
- Teams receive alerts when watched items go out-of-stock
- Price changes are recorded and visible in UI

### Phase 3: API Integrations (Week 5-6)

**Goals:**

- McMaster-Carr API integration
- Shopify Storefront API for any vendor using Shopify
- Watch list management UI

**Deliverables:**

- [ ] McMaster-Carr API client (if approved)
- [ ] Shopify Storefront API client
- [ ] Watch list CRUD API
- [ ] Watch list UI component
- [ ] "Frequently bought together" suggestions

**Success Criteria:**

- McMaster-Carr products import via API
- Teams can watch specific items for notifications

### Phase 4: Community Intelligence (Week 7-8)

**Goals:**

- Cross-team aggregated insights
- Lead time tracking from actual orders
- "Teams who buy X also buy Y"

**Deliverables:**

- [ ] Anonymized order data aggregation
- [ ] Lead time calculation from order → received
- [ ] Related products recommendation engine
- [ ] Community dashboard (opt-in)

**Success Criteria:**

- Agent can suggest related products based on community data
- Actual lead times visible per vendor/region

---

## 9. API Reference

### Import Part from URL

```
POST /api/teams/:teamId/parts/import-from-url

Request:
{
  "url": "https://www.revrobotics.com/rev-41-1301/",
  "addToInventory": true,
  "quantity": 0
}

Response:
{
  "success": true,
  "product": {
    "vendorId": "rev-robotics",
    "name": "HD Hex Motor",
    "sku": "REV-41-1301",
    "description": "...",
    "priceCents": 2499,
    "inStock": true,
    "stockLevel": "in-stock",
    "imageUrl": "https://...",
    "productUrl": "https://..."
  },
  "part": {
    "id": "...",
    "teamId": "...",
    ...
  }
}
```

### Get Catalog Item

```
GET /api/catalog/:vendorId/:sku

Response:
{
  "item": {
    "id": "...",
    "vendorId": "rev-robotics",
    "sku": "REV-41-1301",
    "name": "HD Hex Motor",
    "priceCents": 2499,
    "inStock": true,
    "lastScrapedAt": "2024-12-30T10:00:00Z",
    "priceHistory": [
      { "priceCents": 2499, "recordedAt": "2024-12-30" },
      { "priceCents": 2299, "recordedAt": "2024-11-15" }
    ]
  }
}
```

### Search Catalog

```
GET /api/catalog/search?q=hex+motor&vendor=rev-robotics&inStock=true

Response:
{
  "items": [...],
  "total": 12,
  "page": 1,
  "pageSize": 20
}
```

### Watch Item

```
POST /api/teams/:teamId/watch

Request:
{
  "catalogItemId": "...",
  "notifyPriceDrop": true,
  "notifyBackInStock": true,
  "priceThresholdCents": 2000
}
```

### Trigger Manual Refresh

```
POST /api/catalog/:itemId/refresh

Response:
{
  "success": true,
  "workflowId": "refresh-xxx",
  "item": { ... }
}
```

---

## 10. Monitoring & Alerts

### Metrics to Track

| Metric                     | Description               | Alert Threshold |
| -------------------------- | ------------------------- | --------------- |
| `harvest.success_rate`     | % of successful scrapes   | < 95%           |
| `harvest.duration_seconds` | Time to scrape a product  | > 30s           |
| `catalog.stale_items`      | Items not updated in 48h  | > 100           |
| `workflow.failures`        | Failed Temporal workflows | > 5/hour        |
| `browser_pool.exhausted`   | Pool exhaustion events    | Any             |

### Discord Alert Examples

```
⚠️ Stock Alert: REV-41-1301 (HD Hex Motor)

Status changed: In Stock → Out of Stock
Last price: $24.99
Estimated restock: Unknown

Teams watching: 3
On active BOMs: 2

🔍 View alternatives: /inventory suggest rev-41-1301
```

```
💰 Price Drop: goBILDA 3211-0001-0002 (Gecko Wheel)

Old price: $14.99
New price: $11.99 (20% off)

Teams watching: 5
On active BOMs: 1

✅ React to add to your next order
```

### Temporal Dashboard

Use Temporal Web UI or Cloud dashboard to monitor:

- Running workflows by type
- Failed workflows with stack traces
- Schedule execution history
- Workflow latency distributions

---

## Appendix A: Vendor E-Commerce Platforms

Based on research, here's what we know about vendor platforms:

| Vendor        | Platform           | API Available           | Notes                            |
| ------------- | ------------------ | ----------------------- | -------------------------------- |
| REV Robotics  | Shopify-like       | Possibly Storefront API | Uses standard Shopify structure  |
| goBILDA       | BigCommerce        | Limited                 | Custom scraping needed           |
| AndyMark      | Custom/WooCommerce | No                      | Custom scraping needed           |
| ServoCity     | Custom             | No                      | Related to goBILDA               |
| McMaster-Carr | Custom             | **Yes**                 | Official Product Information API |
| SparkFun      | Custom             | Limited                 | RSS feeds available              |
| Adafruit      | Custom             | Limited                 | JSON product feeds               |

### Detecting Shopify Stores

```typescript
async function isShopifyStore(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${new URL(url).origin}/products.json`);
    return res.ok;
  } catch {
    return false;
  }
}
```

### Shopify Storefront API Usage

For vendors using Shopify, we can use the public Storefront API:

```typescript
const query = `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      availableForSale
      variants(first: 10) {
        edges {
          node {
            sku
            availableForSale
            price {
              amount
            }
          }
        }
      }
      images(first: 1) {
        edges {
          node {
            url
          }
        }
      }
    }
  }
`;
```

---

## Appendix B: Rate Limiting Strategy

To avoid overwhelming vendor websites or getting blocked:

| Vendor Tier | Requests/minute | Batch size | Delay between batches |
| ----------- | --------------- | ---------- | --------------------- |
| Tier 1      | 20              | 10         | 30 seconds            |
| Tier 2      | 10              | 5          | 60 seconds            |
| Tier 3      | 5               | 1          | 120 seconds           |

### Implementation

```typescript
const rateLimits: Record<number, RateLimitConfig> = {
  1: { requestsPerMinute: 20, batchSize: 10, batchDelayMs: 30000 },
  2: { requestsPerMinute: 10, batchSize: 5, batchDelayMs: 60000 },
  3: { requestsPerMinute: 5, batchSize: 1, batchDelayMs: 120000 },
};

async function processWithRateLimit<T>(
  items: T[],
  tier: number,
  processor: (item: T) => Promise<void>
): Promise<void> {
  const config = rateLimits[tier];

  for (let i = 0; i < items.length; i += config.batchSize) {
    const batch = items.slice(i, i + config.batchSize);

    await Promise.all(batch.map(processor));

    if (i + config.batchSize < items.length) {
      await sleep(config.batchDelayMs);
    }
  }
}
```

---

## Appendix C: Error Handling

### Retry Policies by Activity Type

```typescript
const scrapeRetryPolicy: RetryPolicy = {
  initialInterval: "10 seconds",
  backoffCoefficient: 2,
  maximumInterval: "5 minutes",
  maximumAttempts: 3,
  nonRetryableErrorTypes: ["ProductNotFoundError", "VendorBlockedError"],
};

const apiRetryPolicy: RetryPolicy = {
  initialInterval: "1 second",
  backoffCoefficient: 2,
  maximumInterval: "30 seconds",
  maximumAttempts: 5,
};

const notificationRetryPolicy: RetryPolicy = {
  initialInterval: "5 seconds",
  backoffCoefficient: 1.5,
  maximumInterval: "1 minute",
  maximumAttempts: 10,
};
```

### Common Errors

| Error                 | Cause                     | Resolution                         |
| --------------------- | ------------------------- | ---------------------------------- |
| 403 Forbidden         | Bot detection             | Rotate user agent, add delays      |
| 429 Too Many Requests | Rate limit                | Increase delays, reduce batch size |
| Timeout               | Slow page load            | Increase timeout, check network    |
| Selector not found    | Page structure changed    | Update vendor-specific extractor   |
| Invalid JSON-LD       | Malformed structured data | Fall back to HTML extraction       |

---

## References

- [Temporal.io TypeScript SDK](https://docs.temporal.io/develop/typescript)
- [Temporal Schedules](https://docs.temporal.io/develop/typescript/schedules)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Schema.org Product](https://schema.org/Product)
- [Shopify Storefront API](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api)
- [McMaster-Carr API](https://www.mcmaster.com/help/api/)
