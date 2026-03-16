# Figure Graph — Project Memory

## Project Overview
Ballroom dance figure visualization app using ISTD syllabus data. Built with Next.js 15, React Flow, Drizzle ORM + Neon PostgreSQL.

## Current Status
**Repository**: https://github.com/arthurian-ai/figure-graph (forked from curtisjm/figure-graph)
**Workspace**: /home/curtis/.openclaw/workspace-lancelot/figure-graph

## Completed Features
- Dance listing page with figure counts
- Dance detail page (figure list with level badges)
- Figure detail page (step tables, footwork/CBM/sway, precede/follow edges)
- Full dance graph view (React Flow, row-by-level layout)
- Local figure graph view (centered figure with precedes/follows)
- Graph traversal via node clicks
- Level filter toggles (Bronze/Silver/Gold)
- Dark theme with ISTD level colors

## Planned Features (Priority Order)

### 1. Full Graph View Layout Improvement
**Status**: Not started
**Priority**: High
**Complexity**: Medium
- Replace row-based layout with hierarchical/layered algorithm (Dagre or ELK.js)
- Reduce edge crossing, improve readability
- Keep level grouping visually apparent
- Key file: `src/components/graph/dance-graph.tsx`

### 2. Search and Filter on Figure List Pages
**Status**: Not started
**Priority**: High
**Complexity**: Low
- Search input filtering figures by name
- Level filter toggles (Bronze/Silver/Gold)
- Client-side filtering
- Key file: `src/app/dances/[dance]/page.tsx`

### 3. Authentication (Clerk with OAuth)
**Status**: Not started
**Priority**: High
**Complexity**: Medium
- Integrate @clerk/nextjs
- OAuth: Google, GitHub, Apple, Microsoft
- Protect routine/note routes with middleware
- Sync Clerk user ID to users table
- Env vars: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
- Key files: layout.tsx, middleware.ts (new)

### 4. Routine Builder
**Status**: Not started
**Priority**: Medium (requires auth)
**Complexity**: High
- Drag-and-drop builder with @dnd-kit/core
- Searchable figure sidebar
- Edge validation (green check/warning for transitions)
- Save/load via tRPC mutations
- Wall segment and notes per entry
- Key files: routines pages, routine.ts router

### 5. User Figure Notes
**Status**: Not started
**Priority**: Low
**Complexity**: Low
- Personal notes on figure detail page
- CRUD via tRPC mutations
- Plaintext initially
- Key files: figure detail page, figure.ts router

## Technical Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui (New York style, dark theme)
- **Graph**: React Flow (@xyflow/react v12)
- **API**: tRPC v11 (mostly unused for reads)
- **ORM**: Drizzle ORM 0.45
- **Database**: Neon PostgreSQL
- **Auth**: Clerk (planned)
- **Package Manager**: pnpm

## Design Decisions
- Server components query DB directly (no tRPC for reads)
- Lazy DB connection via Proxy pattern
- Leader/Follower terminology (not man/lady)
- YAML as source of truth, database is derived
- Users table uses text PK for Clerk user IDs

## Data Pipeline
1. Extract: Claude Vision API → YAML
2. Source: data/{dance}/{level}/*.yaml (134 figures)
3. Seed: pnpm db:seed rebuilds DB from YAML
4. Edge matching: ~77% match rate with fuzzy name matching
