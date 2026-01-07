# OnShape & CAD Integration Specification

## BuildSeason CAD-to-Inventory Integration

**Version:** 1.0
**Date:** December 30, 2025
**Status:** Draft
**Companion Documents:** [specification.md](./specification.md), [requirements.md](./requirements.md), [ui-refocus-spec.md](./ui-refocus-spec.md)

> **UI Integration:** See [ui-refocus-spec.md](./ui-refocus-spec.md) Phase 4 (Robots & BOM) and Phase 5 (Build - Software & Fabrication) for how OnShape BOM data surfaces in the UI.

---

## Executive Summary

This document specifies how BuildSeason will integrate with CAD systems to provide real-time BOM (Bill of Materials) synchronization, inventory awareness, and proactive part ordering assistance. The primary focus is OnShape (cloud-native, dominant in FTC), with considerations for Fusion 360 and SolidWorks (common alternatives used by students).

**Key Goals:**

1. **Real-time BOM awareness** — Know when design changes affect parts needs
2. **Inventory cross-referencing** — Match CAD parts to vendor catalogs and team inventory
3. **Proactive notifications** — Alert students/mentors when parts need ordering
4. **Lead time intelligence** — Calculate whether parts will arrive before competitions

---

## Table of Contents

1. [OnShape Integration (Primary)](#1-onshape-integration-primary)
2. [ERP & Parts Management Ecosystem](#2-erp--parts-management-ecosystem)
3. [Fusion 360 Integration](#3-fusion-360-integration)
4. [SolidWorks Integration](#4-solidworks-integration)
5. [Vendor Catalog Integration](#5-vendor-catalog-integration)
6. [Implementation Architecture](#6-implementation-architecture)
7. [Data Models](#7-data-models)
8. [Security Considerations](#8-security-considerations)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. OnShape Integration (Primary)

### 1.1 Why OnShape First

OnShape is the dominant CAD platform for FTC teams due to:

- **100% cloud-native** — No installation, works on Chromebooks (common in schools)
- **Free for education** — Full access for students and educators
- **Real-time collaboration** — Multiple students can work simultaneously
- **Modern REST API** — Webhook support, OAuth2, well-documented
- **FTC community adoption** — Most FTC teams use OnShape; FRC teams also common

### 1.2 OnShape API Overview

OnShape provides a comprehensive REST API documented at [onshape-public.github.io/docs](https://onshape-public.github.io/docs/api-intro/).

#### Authentication Methods

| Method              | Use Case                            | Security Level                         |
| ------------------- | ----------------------------------- | -------------------------------------- |
| **OAuth2**          | Production apps, App Store          | Highest (required for App Store)       |
| **API Keys**        | Personal automation, internal tools | Medium (suitable for server-to-server) |
| **Signed Requests** | Enhanced security for API keys      | Medium-High                            |

**Recommendation:** Use OAuth2 for the BuildSeason integration. This:

- Authenticates both the application AND the user
- Provides proper scopes for accessing team documents
- Required if we ever want to publish to OnShape App Store
- Handles token refresh automatically

#### OAuth2 Flow

```
1. User clicks "Connect OnShape" in BuildSeason
2. Redirect to OnShape authorization page
3. User authorizes BuildSeason access
4. OnShape redirects back with authorization code
5. BuildSeason exchanges code for access token + refresh token
6. Store tokens securely (encrypted in database)
7. Use access token for API calls
8. Refresh token when expired (automatic)
```

#### Required OAuth2 Scopes

| Scope           | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `OAuth2Read`    | Read documents, assemblies, BOMs, part properties    |
| `OAuth2ReadPII` | Read user info (name, email) for team member linking |

**Note:** We do NOT need `OAuth2Write` scope — BuildSeason reads from OnShape but never modifies CAD data.

### 1.3 BOM API Endpoint

The primary endpoint for fetching assembly BOMs:

```
GET /api/assemblies/d/{did}/{wvm}/{wvmid}/e/{eid}/bom
```

**Parameters:**

- `did` — Document ID
- `wvm` — Workspace/Version/Microversion indicator (`w`, `v`, or `m`)
- `wvmid` — The actual workspace/version/microversion ID
- `eid` — Element ID (specific assembly tab)

**Response Structure:**

```json
{
  "bomTable": {
    "id": "BOM-TABLE-ID",
    "name": "Bill of Materials",
    "type": "structured",
    "headers": [
      { "id": "item", "name": "Item" },
      { "id": "quantity", "name": "Qty" },
      { "id": "partNumber", "name": "Part Number" },
      { "id": "description", "name": "Description" },
      { "id": "material", "name": "Material" },
      { "id": "vendor", "name": "Vendor" },
      { "id": "unitCost", "name": "Unit Cost" }
    ],
    "rows": [
      {
        "itemSource": {
          "fullConfiguration": "...",
          "documentId": "...",
          "elementId": "..."
        },
        "item": "1",
        "quantity": 4,
        "partNumber": "REV-41-1877",
        "description": "HD Hex Motor",
        "material": "",
        "vendor": "REV Robotics",
        "unitCost": 24.99
      }
    ]
  }
}
```

### 1.4 Webhooks for Real-Time Updates

OnShape webhooks enable real-time notifications when documents change.

#### Available Events

| Event                                   | Description             | Use Case               |
| --------------------------------------- | ----------------------- | ---------------------- |
| `onshape.model.lifecycle.changed`       | Model/assembly modified | Trigger BOM diff check |
| `onshape.model.translation.complete`    | Export completed        | Not needed for BOM     |
| `onshape.revision.created`              | New revision created    | Track formal releases  |
| `onshape.model.lifecycle.metadata`      | Properties modified     | Part info updated      |
| `onshape.model.lifecycle.createversion` | Version created         | Milestone tracking     |

**Primary Event:** `onshape.model.lifecycle.changed` — This fires whenever the assembly is modified, allowing us to detect new parts, removed parts, or quantity changes.

#### Webhook Registration

```typescript
// POST /api/webhooks
{
  "url": "https://api.buildseason.org/webhooks/onshape",
  "events": [
    "onshape.model.lifecycle.changed"
  ],
  "filter": {
    "documentId": "TEAM_DOCUMENT_ID"
  },
  "options": {
    "collapseEvents": true  // Debounce rapid changes
  },
  "isTransient": false  // Persist across restarts
}
```

#### Webhook Payload

When a model changes, OnShape sends:

```json
{
  "event": "onshape.model.lifecycle.changed",
  "documentId": "abc123...",
  "workspaceId": "def456...",
  "elementId": "ghi789...",
  "timestamp": "2025-12-30T22:15:00Z",
  "userId": "user-who-made-change",
  "webhookId": "webhook-registration-id"
}
```

#### Webhook Security

- **Signature Verification:** OnShape signs webhooks with HMAC-SHA256
- **Basic Auth Option:** Can require username/password on webhook URL
- **HTTPS Required:** Webhooks must use secure URLs
- **Retry Policy:** OnShape retries failed deliveries with exponential backoff

### 1.5 Sample OnShape App (Reference)

OnShape provides a reference BOM application: [github.com/onshape-public/app-bom](https://github.com/onshape-public/app-bom)

This Node.js application demonstrates:

- OAuth2 authentication flow
- Assembly navigation
- BOM data retrieval
- Metadata extraction
- Shaded view generation

### 1.6 OnShape TypeScript Client

Official TypeScript client library: [github.com/onshape-public/onshape-ts-client](https://github.com/onshape-public/onshape-ts-client)

```typescript
import { OnshapeClient } from "@onshape/onshape-ts-client";

const client = new OnshapeClient({
  accessKey: process.env.ONSHAPE_ACCESS_KEY,
  secretKey: process.env.ONSHAPE_SECRET_KEY,
});

// Get BOM for assembly
const bom = await client.assemblies.getBillOfMaterials({
  did: documentId,
  wvm: "w",
  wvmid: workspaceId,
  eid: elementId,
});
```

---

## 2. ERP & Parts Management Ecosystem

### 2.1 OpenBOM (Key Integration Partner)

[OpenBOM](https://www.openbom.com/) is the most mature OnShape integration for BOM management and is **free for educational/non-commercial use**.

#### OpenBOM Features

| Feature             | Description                 | BuildSeason Relevance                |
| ------------------- | --------------------------- | ------------------------------------ |
| Bi-directional sync | Changes flow both ways      | Could sync part properties           |
| Part catalogs       | Managed vendor databases    | Reference for part matching          |
| Multi-level BOMs    | Hierarchical structure      | Map to subsystems                    |
| Inventory tracking  | Quantity on hand            | Could synchronize with our inventory |
| CAD integrations    | OnShape, Fusion, SolidWorks | One solution spans platforms         |

#### OpenBOM API

OpenBOM provides a REST API that could be used as an intermediary:

```
- Part catalog management
- BOM export/import
- Inventory sync
- Change notifications
```

#### Integration Options

**Option A: Direct OnShape Integration (Recommended)**

- BuildSeason connects directly to OnShape API
- Full control over data flow and caching
- No third-party dependency

**Option B: OpenBOM as Middleware**

- Teams use OpenBOM for BOM management
- BuildSeason syncs from OpenBOM
- Leverages OpenBOM's existing integrations
- Adds dependency on OpenBOM service

**Recommendation:** Start with direct OnShape integration. Consider OpenBOM integration as future enhancement for teams already using it.

### 2.2 FRCBOM (Community Reference)

[FRCBOM.com](https://frcbom.com/) is a community-built BOM management tool for FRC teams that uses the OnShape API. Documentation at [docs.frcbom.com](https://docs.frcbom.com/).

#### FRCBOM Features (Learning from Community)

| Feature              | Implementation                    | BuildSeason Insight            |
| -------------------- | --------------------------------- | ------------------------------ |
| Custom FeatureScript | Assigns manufacturing processes   | Could track fabrication status |
| Live collaboration   | Real-time updates                 | Already in our architecture    |
| 3D viewer            | In-browser preview                | Nice-to-have, not core         |
| Process tracking     | Pre-process, Process 1, Process 2 | Map to our subsystem status    |
| CAD file download    | Export from OnShape               | Useful for documentation       |

#### Key Lessons from FRCBOM

1. **FeatureScript Integration** — Teams can add custom properties in OnShape that flow to external systems
2. **Manufacturing Process Tracking** — BOM isn't just "what parts" but "what stage are they in"
3. **Team-specific Configuration** — Each team gets customized setup
4. **Mobile Support** — Build sessions happen on tablets/phones too

### 2.3 Arena PLM (Enterprise Reference)

PTC's Arena PLM integrates with OnShape for enterprise use cases. While overkill for FTC teams, it demonstrates patterns:

- One-click BOM push from OnShape to PLM
- Part number management
- Revision control
- Supply chain integration

### 2.4 QBuild Software (ERP Integration)

[QBuild's CADLink](https://www.qbuildsoftware.com/) connects OnShape to ERP systems:

- Real-time two-way BOM sync
- ERP part creation from CAD
- Cloud-native architecture

---

## 3. Fusion 360 Integration

### 3.1 Fusion 360 Overview

Autodesk Fusion 360 is popular with some robotics teams, especially those with Autodesk sponsorships or those preferring its CAM capabilities.

#### Key Differences from OnShape

| Aspect            | OnShape              | Fusion 360                         |
| ----------------- | -------------------- | ---------------------------------- |
| Architecture      | Cloud-native         | Desktop app with cloud sync        |
| API Type          | REST API             | Python/C++ add-ins                 |
| Real-time updates | Webhooks             | Must poll or use add-in            |
| BOM Access        | Direct REST endpoint | Via add-in or Fusion Manage        |
| Auth              | OAuth2               | Forge (Autodesk Platform Services) |

### 3.2 Fusion 360 API Approach

Fusion 360 uses local add-ins rather than REST APIs:

```python
# Fusion 360 Add-in (Python)
import adsk.core
import adsk.fusion

def run(context):
    app = adsk.core.Application.get()
    product = app.activeProduct
    design = adsk.fusion.Design.cast(product)

    # Get BOM from root component
    rootComp = design.rootComponent
    allOccurrences = rootComp.allOccurrences

    for occ in allOccurrences:
        comp = occ.component
        # Extract part info...
```

### 3.3 Fusion 360 Integration Strategy

**Option A: OpenBOM Add-in (Recommended)**

- Teams install OpenBOM add-in for Fusion 360
- BuildSeason syncs from OpenBOM
- Consistent experience across CAD platforms

**Option B: Custom Add-in**

- Develop Fusion 360 add-in that exports BOM
- Send data to BuildSeason API
- More control but significant development effort

**Option C: Manual Export**

- Students export BOM to CSV from Fusion 360
- Upload CSV to BuildSeason
- Lowest barrier, highest friction

**Recommendation:** Prioritize OpenBOM integration as the bridge to Fusion 360. This provides a unified approach without maintaining a Fusion 360 add-in.

### 3.4 Autodesk Platform Services (Forge)

For deeper Fusion 360 integration in the future, Autodesk's [Platform Services](https://aps.autodesk.com/) (formerly Forge) provides:

- Model Derivative API — Extract BOM data from designs
- Webhooks — Notifications for design changes
- Authentication — OAuth2 similar to OnShape

```
POST https://developer.api.autodesk.com/webhooks/v1/hooks
{
  "callbackUrl": "https://api.buildseason.org/webhooks/fusion",
  "scope": { "folder": "urn:..." },
  "hookAttribute": { "events": ["dm.version.added"] }
}
```

---

## 4. SolidWorks Integration

### 4.1 SolidWorks Overview

SolidWorks is the industry standard for professional CAD but less common in FTC due to cost and complexity. Some FRC teams and advanced FTC teams may use it.

#### Architecture Considerations

| Aspect          | Description                               |
| --------------- | ----------------------------------------- |
| Installation    | Desktop application (Windows only)        |
| Data Management | SOLIDWORKS PDM (optional) or 3DEXPERIENCE |
| API             | COM-based (Windows) or PDM API            |
| BOM Export      | XML export to ERP systems                 |

### 4.2 Integration Options

**Option A: OpenBOM Integration (Recommended)**

- OpenBOM has deep SolidWorks integration
- Works with or without PDM
- Automatic BOM sync on save

**Option B: PDM XML Export**

- Configure PDM to export BOM on release
- BuildSeason imports XML files
- Batch processing, not real-time

**Option C: 3DEXPERIENCE Platform**

- Dassault's cloud platform
- More modern API
- Requires 3DEXPERIENCE license

### 4.3 SolidWorks PDM API

For teams using SolidWorks PDM Professional:

```
GET /api/v1/Vaults/{vaultId}/BOMs
```

This endpoint returns BOM data in structured format suitable for ERP integration.

---

## 5. Vendor Catalog Integration

### 5.1 Part Matching Challenge

The core challenge: matching CAD part references to purchasable vendor parts.

**Example:**

- OnShape assembly contains: "HD Hex Motor"
- Need to match to: REV-41-1301 at $24.99 from revrobotics.com

### 5.2 Matching Strategies

#### Strategy 1: Part Number in CAD Properties (Preferred)

Teams configure OnShape parts with vendor SKUs:

```
Part Name: "HD Hex Motor"
Part Number: "REV-41-1301"
Vendor: "REV Robotics"
```

BuildSeason matches on `Part Number` field directly.

#### Strategy 2: Fuzzy Name Matching

Use string similarity to match part names:

```typescript
function matchPart(cadPartName: string, vendorCatalog: Part[]): Part[] {
  return vendorCatalog
    .map((p) => ({
      part: p,
      score: stringSimilarity(cadPartName, p.name),
    }))
    .filter((m) => m.score > 0.7)
    .sort((a, b) => b.score - a.score);
}
```

#### Strategy 3: Team-Defined Mappings

Teams create explicit mappings:

```typescript
partMappings: {
  "HD Hex Motor": "REV-41-1301",
  "Mecanum Wheel 4in": "goBILDA-3213-0001-0096",
  "Servo Bracket": "REV-41-1317"
}
```

### 5.3 Vendor Catalog Schema

```typescript
vendorCatalogItems: {
  id: string;
  vendorId: string; // FK to vendors
  sku: string; // "REV-41-1301"
  name: string; // "HD Hex Motor"
  description: string;
  category: string; // "Motors", "Wheels"
  priceCents: number; // 2499 ($24.99)
  inStock: boolean;
  stockLevel: "in-stock" | "low-stock" | "out-of-stock" | "discontinued";
  leadTimeDays: number; // Estimated if out of stock
  specs: Record<string, any>; // Dimensions, voltage, etc.
  imageUrl: string;
  productUrl: string; // Deep link to vendor page
  lastScrapedAt: Date;
}
```

### 5.4 Vendor Data Sources

| Vendor        | Data Source                      | Update Strategy |
| ------------- | -------------------------------- | --------------- |
| REV Robotics  | Website scraping                 | Daily sync      |
| goBILDA       | Website scraping                 | Daily sync      |
| AndyMark      | Website scraping                 | Daily sync      |
| ServoCity     | Website scraping                 | Daily sync      |
| McMaster-Carr | Not included (catalog too large) | N/A             |

---

## 6. Implementation Architecture

### 6.1 System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        OnShape Integration Flow                       │
│                                                                       │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐            │
│  │   OnShape   │     │ BuildSeason │     │   Discord   │            │
│  │    Cloud    │     │     API     │     │   Channel   │            │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘            │
│         │                   │                   │                    │
│         │ 1. Model changed  │                   │                    │
│         ├──────────────────►│                   │                    │
│         │    (Webhook)      │                   │                    │
│         │                   │                   │                    │
│         │ 2. Fetch BOM      │                   │                    │
│         │◄──────────────────┤                   │                    │
│         │    (REST API)     │                   │                    │
│         │                   │                   │                    │
│         │ 3. Return BOM     │                   │                    │
│         ├──────────────────►│                   │                    │
│         │                   │                   │                    │
│         │                   │ 4. Diff BOM       │                    │
│         │                   │    vs previous    │                    │
│         │                   │                   │                    │
│         │                   │ 5. Cross-ref      │                    │
│         │                   │    inventory      │                    │
│         │                   │                   │                    │
│         │                   │ 6. Check          │                    │
│         │                   │    lead times     │                    │
│         │                   │                   │                    │
│         │                   │ 7. Notify         │                    │
│         │                   ├──────────────────►│                    │
│         │                   │    (via Agent)    │                    │
│         │                   │                   │                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Webhook Handler

```typescript
// routes/webhooks/onshape.ts
import { Hono } from "hono";
import { verifyOnShapeSignature } from "../lib/onshape";
import { temporal } from "../lib/temporal";

const app = new Hono();

app.post("/webhooks/onshape", async (c) => {
  // Verify webhook signature
  const signature = c.req.header("x-onshape-signature");
  const body = await c.req.text();

  if (
    !verifyOnShapeSignature(signature, body, process.env.ONSHAPE_WEBHOOK_SECRET)
  ) {
    return c.text("Invalid signature", 401);
  }

  const payload = JSON.parse(body);

  // Handle different event types
  if (payload.event === "onshape.model.lifecycle.changed") {
    // Start Temporal workflow for BOM sync
    await temporal.workflow.start(onShapeSyncWorkflow, {
      args: [
        {
          documentId: payload.documentId,
          workspaceId: payload.workspaceId,
          elementId: payload.elementId,
          changedBy: payload.userId,
          timestamp: payload.timestamp,
        },
      ],
      taskQueue: "onshape-sync",
      workflowId: `onshape-sync-${payload.documentId}-${Date.now()}`,
    });
  }

  return c.text("OK");
});
```

### 6.3 BOM Sync Workflow (Temporal)

```typescript
// workflows/onshapeSync.ts
import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/onshape";

const {
  fetchCurrentBOM,
  fetchPreviousBOMSnapshot,
  calculateBOMDiff,
  crossReferenceInventory,
  checkVendorAvailability,
  calculateLeadTimes,
  saveBOMSnapshot,
  notifyTeam,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "5 minutes",
});

interface OnShapeSyncInput {
  documentId: string;
  workspaceId: string;
  elementId: string;
  changedBy: string;
  timestamp: string;
}

export async function onShapeSyncWorkflow(
  input: OnShapeSyncInput
): Promise<void> {
  // 1. Get team from OnShape connection
  const connection = await getOnShapeConnection(input.documentId);
  if (!connection) {
    console.log("No BuildSeason team connected to this document");
    return;
  }

  // 2. Fetch current BOM from OnShape
  const currentBOM = await fetchCurrentBOM({
    documentId: input.documentId,
    workspaceId: input.workspaceId,
    elementId: input.elementId,
  });

  // 3. Get previous BOM snapshot
  const previousBOM = await fetchPreviousBOMSnapshot(
    connection.teamId,
    input.documentId
  );

  // 4. Calculate diff
  const diff = await calculateBOMDiff(previousBOM, currentBOM);

  if (!diff.hasChanges) {
    // No meaningful changes, just update timestamp
    await saveBOMSnapshot(connection.teamId, input.documentId, currentBOM);
    return;
  }

  // 5. Cross-reference with team inventory
  const inventoryStatus = await crossReferenceInventory(
    connection.teamId,
    diff
  );

  // 6. Check vendor availability for missing parts
  const availability = await checkVendorAvailability(
    inventoryStatus.missingParts
  );

  // 7. Calculate lead times against competition dates
  const leadTimeAnalysis = await calculateLeadTimes(
    connection.teamId,
    availability
  );

  // 8. Save new snapshot
  await saveBOMSnapshot(connection.teamId, input.documentId, currentBOM);

  // 9. Notify team if action needed
  if (leadTimeAnalysis.partsNeedingAttention.length > 0) {
    await notifyTeam({
      teamId: connection.teamId,
      changedBy: input.changedBy,
      diff,
      inventoryStatus,
      leadTimeAnalysis,
    });
  }
}
```

### 6.4 BOM Diff Algorithm

```typescript
// activities/onshape.ts

interface BOMItem {
  partNumber: string;
  name: string;
  quantity: number;
  vendor?: string;
  unitCost?: number;
}

interface BOMDiff {
  hasChanges: boolean;
  added: BOMItem[];
  removed: BOMItem[];
  quantityChanged: Array<{
    part: BOMItem;
    previousQuantity: number;
    newQuantity: number;
  }>;
}

export function calculateBOMDiff(
  previous: BOMItem[] | null,
  current: BOMItem[]
): BOMDiff {
  if (!previous) {
    return {
      hasChanges: current.length > 0,
      added: current,
      removed: [],
      quantityChanged: [],
    };
  }

  const previousMap = new Map(previous.map((p) => [p.partNumber, p]));
  const currentMap = new Map(current.map((p) => [p.partNumber, p]));

  const added: BOMItem[] = [];
  const removed: BOMItem[] = [];
  const quantityChanged: BOMDiff["quantityChanged"] = [];

  // Find added and quantity changed
  for (const [partNumber, item] of currentMap) {
    const prevItem = previousMap.get(partNumber);
    if (!prevItem) {
      added.push(item);
    } else if (prevItem.quantity !== item.quantity) {
      quantityChanged.push({
        part: item,
        previousQuantity: prevItem.quantity,
        newQuantity: item.quantity,
      });
    }
  }

  // Find removed
  for (const [partNumber, item] of previousMap) {
    if (!currentMap.has(partNumber)) {
      removed.push(item);
    }
  }

  return {
    hasChanges:
      added.length > 0 || removed.length > 0 || quantityChanged.length > 0,
    added,
    removed,
    quantityChanged,
  };
}
```

### 6.5 Agent Notification

```typescript
// activities/notifications.ts

interface NotificationData {
  teamId: string;
  changedBy: string;
  diff: BOMDiff;
  inventoryStatus: InventoryStatus;
  leadTimeAnalysis: LeadTimeAnalysis;
}

export async function notifyTeam(data: NotificationData): Promise<void> {
  const { teamId, changedBy, diff, inventoryStatus, leadTimeAnalysis } = data;

  // Get team's Discord channel
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: { preferences: true },
  });

  // Get user who made changes
  const user = await getUserFromOnShapeId(changedBy);
  const userName = user?.name || "Someone";

  // Build notification message
  let message = `Hey ${userName}, I noticed you updated the assembly. Here's what changed:\n\n`;

  // Added parts
  if (diff.added.length > 0) {
    message += `**New parts needed:**\n`;
    for (const part of diff.added) {
      const status = inventoryStatus.parts.get(part.partNumber);
      const leadTime = leadTimeAnalysis.parts.get(part.partNumber);

      message += `• ${part.name} (qty ${part.quantity})`;
      if (status?.inStock) {
        message += ` — ✅ ${status.quantity} in inventory\n`;
      } else if (status?.onOrder) {
        message += ` — 📦 ${status.onOrderQty} on order, ETA ${status.eta}\n`;
      } else {
        message += ` — ⚠️ Not in stock, not ordered`;
        if (leadTime) {
          message += `. ${leadTime.vendor} has it, ${leadTime.days}-day lead time.`;
        }
        message += `\n`;
      }
    }
    message += `\n`;
  }

  // Quantity changes
  if (diff.quantityChanged.length > 0) {
    message += `**Quantity changes:**\n`;
    for (const change of diff.quantityChanged) {
      const delta = change.newQuantity - change.previousQuantity;
      const direction = delta > 0 ? "⬆️" : "⬇️";
      message += `• ${change.part.name}: ${change.previousQuantity} → ${change.newQuantity} ${direction}\n`;
    }
    message += `\n`;
  }

  // Lead time warnings
  const atRisk = leadTimeAnalysis.partsAtRisk;
  if (atRisk.length > 0) {
    message += `**⚠️ Timeline Alert:**\n`;
    for (const part of atRisk) {
      message += `• ${part.name}: ${part.leadTimeDays}-day lead time may not arrive before ${part.competitionName}\n`;
    }
    message += `\n`;
  }

  // Action buttons
  if (
    diff.added.some((p) => !inventoryStatus.parts.get(p.partNumber)?.inStock)
  ) {
    message += `React ✅ to add missing parts to order queue.`;
  }

  // Send via Discord
  await sendDiscordMessage(team.preferences.discordChannelId, message);
}
```

---

## 7. Data Models

### 7.1 OnShape Connection

```sql
-- Store OnShape OAuth connections per team
onshape_connections (
  id TEXT PRIMARY KEY,
  program TEXT NOT NULL,           -- FK to teams
  number TEXT NOT NULL,            -- FK to teams

  -- OAuth tokens (encrypted)
  access_token TEXT NOT NULL,      -- Encrypted
  refresh_token TEXT NOT NULL,     -- Encrypted
  token_expires_at TIMESTAMP NOT NULL,

  -- Connected documents
  documents JSONB,                 -- Array of linked document IDs

  -- Webhook registration
  webhook_id TEXT,
  webhook_secret TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (program, number) REFERENCES teams(program, number)
);
```

### 7.2 BOM Snapshots

```sql
-- Store BOM snapshots for diff comparison
bom_snapshots (
  id TEXT PRIMARY KEY,
  program TEXT NOT NULL,
  number TEXT NOT NULL,

  -- OnShape identifiers
  document_id TEXT NOT NULL,
  workspace_id TEXT,
  version_id TEXT,
  element_id TEXT NOT NULL,

  -- BOM data
  items JSONB NOT NULL,            -- Array of BOMItem

  -- Metadata
  onshape_user_id TEXT,            -- Who made the change
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (program, number) REFERENCES teams(program, number)
);

-- Index for quick lookup
CREATE INDEX idx_bom_snapshots_document ON bom_snapshots(document_id, created_at DESC);
```

### 7.3 Part Mappings

```sql
-- Team-defined mappings from CAD parts to vendor SKUs
part_mappings (
  id TEXT PRIMARY KEY,
  program TEXT NOT NULL,
  number TEXT NOT NULL,

  cad_part_number TEXT NOT NULL,   -- Part number/name from CAD
  vendor_sku TEXT NOT NULL,        -- Matched vendor SKU
  vendor_id TEXT NOT NULL,         -- FK to vendors

  -- Matching metadata
  match_type TEXT,                 -- 'exact', 'fuzzy', 'manual'
  confidence REAL,                 -- 0.0 to 1.0

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (program, number) REFERENCES teams(program, number),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  UNIQUE (program, number, cad_part_number)
);
```

---

## 8. Security Considerations

### 8.1 OAuth Token Security

- **Encryption at rest:** All OAuth tokens encrypted with AES-256-GCM
- **Token rotation:** Refresh tokens regularly even before expiry
- **Scope limitation:** Request only `OAuth2Read` and `OAuth2ReadPII`
- **Revocation handling:** Detect and handle revoked tokens gracefully

### 8.2 Webhook Security

```typescript
import crypto from "crypto";

export function verifyOnShapeSignature(
  signature: string | null,
  body: string,
  secret: string
): boolean {
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### 8.3 Data Access Control

- Only team members can view their team's OnShape connections
- OAuth connection requires mentor/admin role
- BOM data inherits team permission model
- Webhook secret unique per team

---

## 9. Implementation Phases

### Phase 1: Basic OnShape Integration (MVP)

**Goal:** Manual BOM import with inventory cross-reference

**Features:**

- [ ] OAuth2 connection flow
- [ ] Manual "Sync BOM" button
- [ ] BOM display in BuildSeason UI
- [ ] Basic inventory cross-reference (exact part number match)
- [ ] "Add missing parts to order" workflow

**Effort:** 2-3 weeks

### Phase 2: Real-Time Webhook Integration

**Goal:** Automatic BOM updates when OnShape changes

**Features:**

- [ ] Webhook registration per team
- [ ] Background BOM sync via Temporal workflow
- [ ] BOM diff calculation and storage
- [ ] Discord notifications for BOM changes
- [ ] Lead time warnings

**Effort:** 2-3 weeks

### Phase 3: Intelligent Part Matching

**Goal:** Smart matching of CAD parts to vendor catalog

**Features:**

- [ ] Fuzzy name matching algorithm
- [ ] Team-defined part mappings
- [ ] "Suggested match" UI for ambiguous parts
- [ ] Learning from team corrections
- [ ] Vendor catalog integration

**Effort:** 2-3 weeks

### Phase 4: Multi-CAD Support

**Goal:** Support Fusion 360 and SolidWorks teams

**Features:**

- [ ] OpenBOM integration as middleware
- [ ] CSV import for manual workflows
- [ ] Fusion 360 export documentation
- [ ] SolidWorks export documentation

**Effort:** 3-4 weeks

### Phase 5: Advanced Features

**Goal:** Community intelligence and predictions

**Features:**

- [ ] "Teams who buy X also buy Y" suggestions
- [ ] Vendor stock monitoring
- [ ] Proactive restock alerts
- [ ] Historical BOM analysis

**Effort:** Ongoing

---

## Appendix A: OnShape API Quick Reference

### Authentication Endpoints

| Endpoint           | Method | Description              |
| ------------------ | ------ | ------------------------ |
| `/oauth/authorize` | GET    | Start OAuth flow         |
| `/oauth/token`     | POST   | Exchange code for tokens |
| `/oauth/token`     | POST   | Refresh access token     |

### Assembly Endpoints

| Endpoint                                            | Method | Description           |
| --------------------------------------------------- | ------ | --------------------- |
| `/api/assemblies/d/{did}/{wvm}/{wvmid}/e/{eid}/bom` | GET    | Get assembly BOM      |
| `/api/assemblies/d/{did}/{wvm}/{wvmid}/e/{eid}`     | GET    | Get assembly metadata |

### Webhook Endpoints

| Endpoint                    | Method | Description        |
| --------------------------- | ------ | ------------------ |
| `/api/webhooks`             | POST   | Register webhook   |
| `/api/webhooks/{webhookId}` | DELETE | Unregister webhook |
| `/api/webhooks`             | GET    | List webhooks      |

### Document Endpoints

| Endpoint                        | Method | Description               |
| ------------------------------- | ------ | ------------------------- |
| `/api/documents`                | GET    | List accessible documents |
| `/api/documents/{did}`          | GET    | Get document metadata     |
| `/api/documents/{did}/elements` | GET    | List elements (tabs)      |

---

## Appendix B: References

### Official Documentation

- [OnShape Developer Portal](https://dev-portal.onshape.com/)
- [OnShape API Documentation](https://onshape-public.github.io/docs/)
- [OnShape Webhook Documentation](https://onshape-public.github.io/docs/webhook/)
- [OnShape OAuth Guide](https://onshape-public.github.io/docs/auth/oauth/)

### Sample Applications

- [OnShape BOM App (GitHub)](https://github.com/onshape-public/app-bom)
- [OnShape TypeScript Client](https://github.com/onshape-public/onshape-ts-client)
- [FRCBOM Documentation](https://docs.frcbom.com/)

### Third-Party Integrations

- [OpenBOM for OnShape](https://www.openbom.com/integrations)
- [OpenBOM for Fusion 360](https://www.openbom.com/openbom-add-in-for-autodesk-fusion-360)
- [OpenBOM for SolidWorks](https://www.openbom.com/openbom-for-solidworks)

### Community Resources

- [Chief Delphi - FRCBOM Discussion](https://www.chiefdelphi.com/t/introducing-again-frcbom-com-a-bom-and-manufacturing-dashboard-for-teams-using-onshape-api/505737)
- [Game Manual 0 - Useful Resources](https://gm0.org/en/latest/docs/useful-resources.html)
- [FRCDesign.org](https://www.frcdesign.org/)

---

_This specification will evolve as we implement and learn from user feedback._
