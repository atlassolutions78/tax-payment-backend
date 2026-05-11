# Tax Payment System — Architecture & Design

A NestJS backend for a two-sided tax management platform: businesses file declarations, field agents collect payments, and government officers track compliance and manage tax periods.

---

## Table of Contents

- [Overview](#overview)
- [System Roles](#system-roles)
- [Bounded Contexts](#bounded-contexts)
- [Folder Structure](#folder-structure)
- [Extensibility Strategy](#extensibility-strategy)
- [Module Breakdown](#module-breakdown)
- [Core Entities](#core-entities)
- [API Surface](#api-surface)
- [Data Flow](#data-flow)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)

---

## Overview

The system serves three distinct user groups:

- **Taxpayers (Businesses):** Register and submit periodic tax declarations.
- **Field Agents:** Visit businesses, collect payments against submitted declarations, and submit daily remittances to the government.
- **Government Officers:** Define tax periods and deadlines, monitor compliance, reconcile agent remittances, and generate reports.

---

## System Roles

| Role | Description |
|---|---|
| `TAXPAYER` | A registered business entity that files declarations |
| `AGENT` | A field collector who collects payments from businesses on behalf of the government |
| `GOV_OFFICER` | A government staff member who monitors compliance and reconciles remittances |
| `ADMIN` | System administrator — manages users, roles, and system config |

---

## Bounded Contexts

The system is organized into four bounded contexts. Each context owns its data and communicates with others only through well-defined service interfaces — never deep internal imports across context boundaries.

`auth` and `users` are cross-cutting infrastructure and sit at the top level, outside any bounded context.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     auth · users  (cross-cutting)                        │
└──────────────────────────────────────────────────────────────────────────┘
                                  │ service calls
        ┌─────────────────────────┼──────────────┬───────────────┐
        ▼                         ▼              ▼               ▼
┌───────────────────┐  ┌──────────────────┐  ┌────────┐  ┌──────────────────────┐
│     BUSINESS      │  │    TAX ENGINE    │  │ AGENTS │  │   GOV & COMPLIANCE   │
│    OPERATIONS     │─▶│                  │  │        │  │                      │
│                   │  │  tax-periods     │  │ agents │  │  compliance          │
│  taxpayers        │  │  tax-rules       │  │ collec-│  │  reports             │
│  declarations     │  │  calculator      │  │ tions  │  │  notifications       │
│                   │◀─│ (tax result back)│  │ remit- │  │                      │
└───────────────────┘  └──────────────────┘  │ tances │  └──────────────────────┘
                                              └────────┘
```

`Declaration` is the shared reference point across all contexts — business owns it, agents collect against it, gov tracks it.

---

## Folder Structure

```
src/
│
├── auth/                            # Cross-cutting: authentication
│   ├── strategies/                  # JWT, refresh token
│   ├── guards/                      # JwtAuthGuard, RolesGuard
│   ├── decorators/                  # @Roles(), @CurrentUser()
│   └── auth.module.ts
│
├── users/                           # Cross-cutting: user management
│   ├── entities/user.entity.ts
│   ├── dto/
│   └── users.module.ts
│
├── business/                        # Bounded context: Business Operations
│   ├── taxpayers/
│   │   ├── entities/taxpayer.entity.ts
│   │   ├── dto/
│   │   └── taxpayers.module.ts
│   ├── declarations/
│   │   ├── entities/declaration.entity.ts
│   │   ├── dto/
│   │   └── declarations.module.ts
│   └── business.module.ts
│
├── tax-engine/                      # Bounded context: Tax Engine
│   ├── tax-periods/
│   │   ├── entities/tax-period.entity.ts
│   │   ├── dto/
│   │   └── tax-periods.module.ts
│   ├── tax-rules/
│   │   ├── entities/tax-rule.entity.ts
│   │   ├── dto/
│   │   └── tax-rules.module.ts
│   ├── calculator/
│   │   ├── strategies/
│   │   │   ├── vat.strategy.ts
│   │   │   └── income-tax.strategy.ts
│   │   ├── tax-calculator.service.ts
│   │   └── calculator.module.ts
│   └── tax-engine.module.ts
│
├── agents/                          # Bounded context: Field Agents
│   ├── agents/
│   │   ├── entities/agent.entity.ts
│   │   ├── dto/
│   │   └── agents.module.ts
│   ├── collections/
│   │   ├── entities/collection.entity.ts
│   │   ├── dto/
│   │   └── collections.module.ts
│   ├── remittances/
│   │   ├── entities/remittance.entity.ts
│   │   ├── dto/
│   │   └── remittances.module.ts
│   └── agents.module.ts
│
├── gov/                             # Bounded context: Gov & Compliance
│   ├── compliance/
│   │   ├── entities/compliance-record.entity.ts
│   │   ├── dto/
│   │   └── compliance.module.ts
│   ├── reports/
│   │   └── reports.module.ts
│   └── gov.module.ts
│
├── notifications/                   # Cross-cutting: async alerts
│   ├── jobs/                        # Bull queue processors
│   ├── templates/                   # Email templates
│   └── notifications.module.ts
│
├── integrations/                    # Cross-cutting: external system integrations
│   └── business-registry/
│       ├── business-registry.repository.ts  # all external DB queries isolated here
│       ├── business-registry.entity.ts      # read-only entity mapping to external schema
│       └── business-registry.module.ts
│
└── common/                          # Cross-cutting: shared utilities
    ├── filters/
    ├── interceptors/
    ├── pipes/
    └── enums/
```

---

## Extensibility Strategy

### 1. Pluggable Tax Calculation (Strategy Pattern)

Tax calculation logic lives in `tax-engine/calculator/strategies/`. Each tax type is its own strategy implementing a shared interface:

```typescript
interface TaxStrategy {
  taxType: TaxType;
  calculate(context: TaxContext): TaxResult;
}

interface TaxContext {
  taxpayer: TaxpayerProfile;
  period: TaxPeriod;
}
```

Adding a new tax type requires only a new strategy file. No changes are needed in declarations, agents, or compliance.

### 2. Tax Rules in the Database, Not Code

Rates and thresholds are stored as `TaxRule` entities rather than hardcoded values:

```
TaxRule {
  id, taxType, name, condition (JSONB), rate, flatAmount,
  applicableFrom, applicableTo, priority, isActive
}
```

Government officers update rates through the admin panel without a code deployment.

### 3. Modular Service Communication

Modules communicate through direct service injection across bounded context boundaries. Each context exposes only what other contexts need.

```
declarations.service    →  tax-calculator.service  (get tax amount on submit)
declarations.service    →  compliance.service       (update record on submit)
declarations.service    →  notifications.service    (send confirmation)

collections.service     →  compliance.service       (mark COMPLIANT on collection)
collections.service     →  notifications.service    (send receipt to taxpayer)

remittances.service     →  compliance.service       (flag remittance submitted)
remittances.service     →  notifications.service    (notify gov officer)

scheduled job           →  compliance.service       (flag NON_FILERs after deadline)
                        →  notifications.service    (send bulk reminders)
```

### 4. Business Registry Integration (Shared Database)

The external business registration system provides read-only database access. A second TypeORM connection is configured pointing to that database — the application's own DB connection remains unchanged.

**Two database connections:**
```
Connection 1 (read/write) → tax payment DB (own data)
Connection 2 (read-only)  → business registry DB (external, read-only)
```

**Fields pulled from the external DB — nothing more:**
| Field | Purpose |
|---|---|
| `tin` | Primary identifier and login credential |
| `businessName` | Display and receipts |
| `sector` | Tax calculation rules may vary by sector |
| `status` | Whether the business is still active |

All external DB queries are isolated inside `integrations/business-registry/business-registry.repository.ts`. If the external schema changes, only that file needs updating — nothing else in the system is aware of the external DB.

**Registration flow:**
```
Taxpayer enters TIN + sets a password
  → business-registry.repository queries external DB by TIN
  → TIN not found → registration rejected
  → TIN found and active → the four fields are stored locally in Taxpayer entity
  → Account created, login from this point uses local DB only
```

**Keeping data fresh (re-fetch on login):**
```
Taxpayer logs in with TIN + password
  → Password verified against local DB
  → business-registry.repository silently re-fetches the four fields
  → Local Taxpayer record updated if anything has changed
  → JWT issued
```

Only the fields this system cares about are re-fetched. Changes in the external DB to anything outside those four fields have no effect.

### 5. Agent Role is Designed to Evolve

The agents context is scoped to collection and remittance for the MVP. The `Agent` entity and its boundaries are kept separate from business operations so the workflow can be changed independently — without touching declarations or compliance — when payment methods change.

---

## Module Breakdown

### `auth`
Handles JWT authentication and role-based access control. Guards protect all routes by role.

### `users`
Shared user entity across all roles. Stores credentials, role, and basic profile.

### `business/taxpayers`
Stores the minimal business profile mirrored from the external business registry: TIN, business name, sector, and active status. TIN is the primary login identifier. The record is created on first registration and silently refreshed on every login.

### `business/declarations`
The core filing workflow. Each declaration is tied to a `TaxPeriod` and receives its `taxAmount` from the Tax Engine on submission.

**Declaration statuses:**
| Status | Meaning |
|---|---|
| `DRAFT` | Saved but not yet submitted |
| `SUBMITTED` | Filed — agent can now collect payment |

### `tax-engine/tax-periods`
Government defines the fiscal calendar: period type, dates, filing deadline, and applicable tax types.

### `tax-engine/tax-rules`
Rates, thresholds, and conditions stored in the database. Manageable without code changes.

### `tax-engine/calculator`
Loads applicable rules, selects the correct strategy per tax type, and returns a `TaxResult` containing the amount and a detailed breakdown.

### `agents/agents`
Agent profile linked to a `User`. Stores the agent's assigned zone or territory.

### `agents/collections`
An agent looks up a taxpayer by TIN, views their submitted declaration and calculated tax amount, and records a payment on their behalf. A receipt is generated for the taxpayer on completion.

**Collection statuses:** `PENDING`, `COMPLETED`, `FAILED`

### `agents/remittances`
At the end of each working day, an agent groups all completed collections into a remittance batch and submits it to the government. A gov officer then confirms receipt of the funds.

**Remittance statuses:** `OPEN`, `SUBMITTED`, `CONFIRMED`, `DISPUTED`

### `gov/compliance`
Aggregates declaration and collection data per taxpayer per period. Records are generated automatically when a deadline passes.

**Compliance statuses:** `COMPLIANT`, `NON_FILER`, `OUTSTANDING`, `UNDER_REVIEW`

### `gov/reports`
Generates compliance and collection reports for government officers, exportable as CSV or PDF.

### `notifications`
Bull queue workers triggered by direct service calls. Handles deadline reminders, submission confirmations, collection receipts, remittance alerts, and bulk government notices.

---

## Core Entities

### `User`
```
id, tin, passwordHash, role (TAXPAYER | AGENT | GOV_OFFICER | ADMIN), createdAt, updatedAt
```

### `Taxpayer`
```
id, userId (FK), tin, businessName, sector, status, lastSyncedAt
```

### `TaxPeriod`
```
id, name, type (MONTHLY | QUARTERLY | ANNUAL), startDate, endDate,
filingDeadline, taxTypes[], createdBy (FK → User), isActive
```

### `TaxRule`
```
id, taxType, name, condition (JSONB), rate (%), flatAmount,
applicableFrom, applicableTo, priority, isActive
```

### `Declaration`
```
id, taxpayerId (FK), taxPeriodId (FK), status, declaredIncome,
calculatedTaxAmount, taxBreakdown (JSONB), supportingDocuments[], submittedAt
```

### `Agent`
```
id, userId (FK), assignedZone, isActive, createdAt
```

### `Collection`
```
id, agentId (FK), declarationId (FK), taxpayerId (FK), amount,
method, referenceNumber, status, collectedAt, receiptUrl, remittanceId (FK nullable)
```

### `Remittance`
```
id, agentId (FK), status, totalAmount, collectionCount,
submittedAt, confirmedBy (FK → User nullable), confirmedAt, note
```

### `ComplianceRecord`
```
id, taxpayerId (FK), taxPeriodId (FK), status, declarationId (FK nullable),
collectionId (FK nullable), flaggedAt, resolvedAt, note
```

---

## API Surface

### Business (Taxpayer) Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register with TIN — verified against business registry |
| `POST` | `/auth/login` | Login with TIN + password — silently re-syncs business info |
| `GET` | `/tax-periods` | List active tax periods |
| `POST` | `/declarations` | Create a draft declaration |
| `PATCH` | `/declarations/:id` | Update a draft |
| `POST` | `/declarations/:id/submit` | Submit — triggers tax calculation |
| `GET` | `/declarations` | List own declarations |
| `GET` | `/declarations/:id` | View a single declaration |
| `GET` | `/compliance/my-status` | View own compliance status |

### Agent Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Login and get JWT |
| `GET` | `/agents/taxpayers/search` | Look up a taxpayer by TIN |
| `GET` | `/agents/declarations/:taxpayerId` | View submitted declarations for a taxpayer |
| `POST` | `/agents/collections` | Record a payment collection |
| `GET` | `/agents/collections` | List own collections |
| `GET` | `/agents/collections/:id/receipt` | Download collection receipt |
| `POST` | `/agents/remittances` | Submit a daily remittance batch |
| `GET` | `/agents/remittances` | List own remittances |

### Government Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/tax-periods` | Create a tax period |
| `PATCH` | `/tax-periods/:id` | Update a tax period |
| `POST` | `/tax-rules` | Create a tax rule |
| `PATCH` | `/tax-rules/:id` | Update a rule |
| `GET` | `/declarations` | View all declarations (filterable) |
| `GET` | `/compliance` | View all compliance records |
| `GET` | `/compliance/non-filers` | Non-filers for a given period |
| `POST` | `/compliance/notify` | Send bulk reminders to non-filers |
| `GET` | `/agents/remittances` | View all agent remittances |
| `PATCH` | `/agents/remittances/:id/confirm` | Confirm a remittance |
| `GET` | `/reports/compliance` | Export compliance report (CSV/PDF) |
| `GET` | `/reports/collections` | Export agent collection report |

---

## Data Flow

### Business registers for the first time

```
Taxpayer enters TIN + chooses a password
  → System queries business registry DB by TIN
  → TIN not found → reject: "Business not registered in the registry"
  → TIN found but status inactive → reject: "Business is not active"
  → TIN found and active →
      pull businessName, sector, status from registry
      create User record (tin, hashedPassword, role: TAXPAYER)
      create Taxpayer record (tin, businessName, sector, status, lastSyncedAt: now)
  → JWT issued
```

### Business logs in

```
Taxpayer enters TIN + password
  → TIN not found in local DB → "Account does not exist, please register"
  → TIN found, password wrong → "Invalid credentials"
  → TIN found, password correct →
      silently query business registry DB by TIN
      if registry is unreachable → skip sync, proceed with local data
      if registry responds →
          compare fetched fields with local Taxpayer record
          if anything changed → update local record, set lastSyncedAt: now
          if status is now inactive → block login: "Business is no longer active"
  → JWT issued
```

The taxpayer never interacts with the sync — it happens transparently on every successful login.

### Business files a tax declaration

```
Taxpayer creates and submits a declaration
  → Tax Engine loads TaxRules for the period
  → Calculator runs the matching strategy, returns TaxResult
  → TaxResult stored on the declaration (amount + JSONB breakdown)
  → compliance.service updates the record status
  → notifications.service sends a confirmation to the taxpayer
```

### Agent collects a payment

```
Agent searches taxpayer by TIN
  → Sees submitted declaration and calculated tax amount
  → Records collection (amount, method, reference)
  → Receipt generated and sent to taxpayer
  → compliance.service marks the taxpayer's record as COMPLIANT
  → Collection added to agent's open remittance batch
```

### Agent submits a daily remittance

```
Agent submits remittance at end of day
  → All completed collections for the day are grouped
  → Remittance status set to SUBMITTED
  → notifications.service alerts the gov officer
  → Gov officer reviews and confirms receipt of funds
  → Remittance status set to CONFIRMED
```

### Government tracks compliance

```
Scheduled job fires after a TaxPeriod deadline
  → compliance.service generates records for all registered taxpayers
  → No declaration filed → status set to NON_FILER
  → Declaration submitted with no collection → status set to OUTSTANDING
  → Gov officer filters the dashboard by status
  → Officer triggers bulk reminders → notifications.service queues emails
  → Officer exports compliance or collection report
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (TypeScript) |
| Database | PostgreSQL |
| ORM | TypeORM |
| Auth | JWT + Passport.js |
| Queue | Bull + Redis |
| Validation | class-validator + class-transformer |
| Docs | Swagger / OpenAPI |
| Testing | Jest |
| Package manager | pnpm |

---

## Environment Variables

Create a `.env` file at the project root:

```env
# Own database (Prisma — hosted on Render)
DATABASE_URL=postgresql://user:password@host:5432/tax_payment_db

# Business registry database (read-only)
REGISTRY_DATABASE_URL=postgresql://readonly_user:password@host:5432/business_registry

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

REDIS_HOST=localhost
REDIS_PORT=6379
```
