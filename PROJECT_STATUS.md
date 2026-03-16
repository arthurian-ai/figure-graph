# Figure Graph — Project Status

## Overview

Figure Graph is a Next.js application for visualizing the ISTD (International Standard of Teachers of Dancing) ballroom dance syllabus as an interactive directed graph. Users can browse figures for each dance, explore precede/follow relationships between figures, and traverse the graph visually. The app is a personal project being built iteratively with AI agents.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (CSS-native config via `@theme inline`), shadcn/ui (New York style, dark theme)
- **Graph Visualization**: React Flow (@xyflow/react v12)
- **API Layer**: tRPC v11 with superjson (currently unused — server components query DB directly)
- **ORM**: Drizzle ORM 0.45 with Neon PostgreSQL (serverless HTTP driver)
- **Package Manager**: pnpm
- **Dev Environment**: Nix flakes (flake.nix provides Node.js 22, pnpm)

## Project Structure

```
src/
  app/                          # Next.js App Router pages
    dances/                     # Dance listing page
      [dance]/                  # Dance detail (figure list)
        graph/                  # Full dance graph view
        figures/
          [id]/                 # Figure detail page (steps, tech details, edges)
            graph/              # Local figure graph view
    routines/                   # Routine pages (placeholder)
    api/trpc/[trpc]/            # tRPC API handler
  components/
    graph/
      dance-graph.tsx           # Main graph component (full + local layouts)
      figure-node.tsx           # Custom React Flow node (name + level border color)
    providers.tsx               # tRPC + React Query provider wrapper
    ui/                         # shadcn/ui components
  db/
    schema.ts                   # Drizzle ORM schema (all tables)
    index.ts                    # Lazy DB connection via Proxy pattern
  server/
    trpc.ts                     # tRPC initialization
    routers/                    # tRPC routers (dance, figure, routine)
  lib/
    trpc.ts                     # Client-side tRPC hooks
    utils.ts                    # cn() utility for class merging

data/                           # YAML source of truth
  {dance}/{level}/*.yaml        # One file per figure (134 total)
  extracted/                    # Backup of original extraction
scripts/
  seed.ts                       # Wipe-and-reseed DB from YAML files
  extract_figures.py            # Claude Vision API extraction from PDF
  split_figures.py              # Utility: split single YAML into per-figure files
  rename_man_lady.py            # Utility: bulk rename man/lady to leader/follower
```

## Database Schema

### Core Tables
- **dances**: id, name (slug), displayName, timeSignature, tempoDescription
- **figures**: id, danceId, figureNumber (nullable), name, variantName, level (enum), leaderSteps (JSONB), followerSteps (JSONB), leaderFootwork, followerFootwork, leaderCbm, followerCbm, leaderSway, followerSway, timing, beatValue, notes (JSONB string array)
- **figure_edges**: id, sourceFigureId, targetFigureId, level (enum), conditions

### User Tables (schema exists, no UI yet)
- **users**: id (text PK for Clerk), createdAt, updatedAt
- **routines**: id, userId, danceId, name, description, isPublished, timestamps
- **routine_entries**: id, routineId, figureId, position, wallSegment, notes
- **figure_notes**: id, userId, figureId, content, timestamps

### Enums
- **level**: student_teacher, associate, licentiate, fellow
- **wall_segment**: long1, short1, long2, short2

## Data Pipeline

1. **Extraction**: `scripts/extract_figures.py` uses Claude Vision API to OCR scanned PDF pages into structured YAML
2. **Source of truth**: Individual YAML files in `data/{dance}/{level}/{num}-{name}.yaml` — database is a derived artifact
3. **Seeding**: `pnpm db:seed` wipes all tables and rebuilds from YAML. Edge matching uses fuzzy name matching (abbreviation expansion, compound name matching, condition prefix extraction). Current match rate: ~77%
4. **Schema sync**: `pnpm db:push` applies Drizzle schema changes to Neon

## Current Features

### Implemented
- **Dance listing page**: Shows all dances with figure counts, links to detail and graph views
- **Dance detail page**: Lists all figures for a dance, sorted by figure number, with level badges (Bronze/Silver/Gold colors)
- **Figure detail page**: Shows leader/follower step tables (tabbed), footwork/CBM/sway, notes, and precede/follow edge lists with links to neighbors
- **Full dance graph view**: React Flow visualization of all figures in a dance, grouped by level in rows. Nodes show figure name with level-colored borders. Edges are uniform grey with arrows.
- **Local figure graph view**: Center figure with glow effect, precedes stacked on left, follows stacked on right. Figures grouped by level within each side with extra spacing between groups. Figures appearing in both precede and follow sets get a node on each side.
- **Graph traversal**: Clicking a node in local graph view navigates to that node's local graph
- **Level filter toggles**: Bronze/Silver/Gold toggle buttons to show/hide figures by exam level in both graph views
- **Client-side navigation**: All internal links use Next.js `<Link>` for SPA-like navigation
- **Dark theme**: oklch-based color system with ISTD level colors — Bronze (#CD7F32), Silver (#C0C0C0), Gold (#FFD700)

### Design Decisions
- **Server components over tRPC for reads**: Pages use `getDb()` directly in async server components instead of tRPC, avoiding client-side data fetching overhead. tRPC is reserved for future client-side mutations.
- **Lazy DB connection**: `src/db/index.ts` uses a Proxy to defer Neon initialization until first query, preventing build-time errors when DATABASE_URL isn't available.
- **Leader/Follower terminology**: Replaced traditional man/lady with leader/follower throughout data and UI.
- **YAML as source of truth**: The database is fully rebuildable from YAML files. Manual edits go in YAML, then `pnpm db:seed` propagates changes.

## Planned Features

The following features should be implemented in order. Each feature should be developed on the main branch with detailed commit messages following conventional commit style (e.g., `feat:`, `fix:`, `refactor:`). After completing each feature, create a summary of changes and commit it.

### 1. Full Graph View Layout Improvement

**Priority**: High
**Complexity**: Medium

The current full graph view uses a simple row-by-level layout that becomes unreadable for dances with many figures. Edges cross extensively and nodes overlap visually.

**Requirements**:
- Replace the row-based layout with a more readable algorithm. Options to evaluate:
  - Hierarchical/layered layout (e.g., Dagre or ELK.js) that respects edge direction
  - Force-directed layout with level-based constraints
  - Manual/saved positions that users can adjust and persist
- Edges should be routable without excessive crossing
- Level grouping should still be visually apparent (via node colors, not necessarily spatial grouping)
- The graph should fit reasonably on screen with the fit-view option
- Consider adding a legend for level colors

**Key files**: `src/components/graph/dance-graph.tsx` (the `layoutFull` function)

**Notes**: The `@xyflow/react` library supports custom layout algorithms. Dagre (`@dagrejs/dagre`) is a common choice for directed graph layouts in React Flow. ELK.js is more powerful but heavier.

### 2. Search and Filter on Figure List Pages

**Priority**: High
**Complexity**: Low

**Requirements**:
- Add a search input to the dance detail page (`/dances/[dance]`) that filters figures by name as the user types
- Add level filter toggles (Bronze/Silver/Gold) matching the graph view's toggle style
- Filter should be client-side since all figures are already loaded via the server component
- Consider making this a reusable component since it mirrors the graph toggle pattern

**Key files**: `src/app/dances/[dance]/page.tsx`

### 3. Authentication (Clerk with OAuth)

**Priority**: High (blocks routines and user notes)
**Complexity**: Medium

**Requirements**:
- Integrate Clerk for authentication (`@clerk/nextjs`)
- Enable OAuth providers: Google, GitHub, and any other reasonable services Clerk supports easily (Apple, Microsoft)
- Add sign-in/sign-up buttons to the header nav
- Protect routine and note routes with Clerk middleware
- On first sign-in, create a user record in the `users` table (sync Clerk user ID)
- The `users` table already uses `text("id")` as PK, designed for Clerk's user ID format
- Add `.env` variables: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

**Key files**: `src/app/layout.tsx` (wrap with ClerkProvider), `src/middleware.ts` (new, for route protection), `src/db/schema.ts` (users table already exists)

**Notes**: Clerk's Next.js App Router integration uses `<ClerkProvider>` in the root layout and a `middleware.ts` file for protecting routes. See Clerk's Next.js quickstart docs.

### 4. Routine Builder

**Priority**: Medium (requires auth)
**Complexity**: High

**Requirements**:
- Replace the placeholder routine pages with a functional drag-and-drop builder
- User selects a dance, then adds figures from a searchable sidebar
- Figures are ordered in a sequence — the UI should show the chain with edge validation (green check if the transition exists in figure_edges, warning if not)
- Save/load routines via tRPC mutations (this is where tRPC gets used for writes)
- Routine list page shows the user's saved routines
- Each routine entry can optionally specify a wall segment and notes
- Consider using `@dnd-kit/core` for drag-and-drop

**Key files**:
- `src/app/routines/page.tsx` (list)
- `src/app/routines/new/page.tsx` (builder, needs full rewrite)
- `src/app/routines/[id]/page.tsx` (view/edit)
- `src/server/routers/routine.ts` (tRPC mutations)

**Database**: The `routines` and `routine_entries` tables already exist in the schema.

### 5. User Figure Notes

**Priority**: Low
**Complexity**: Low

**Requirements**:
- On the figure detail page, add a section for personal notes (below the precede/follow cards)
- Authenticated users can add, edit, and delete their own notes
- Notes are stored in the `figure_notes` table (already in schema)
- Use tRPC mutations for CRUD operations
- Notes should be plaintext (no rich text editor needed initially)

**Key files**:
- `src/app/dances/[dance]/figures/[id]/page.tsx` (add notes section)
- `src/server/routers/figure.ts` (add note CRUD procedures)

## Development Guidelines

- **Commits**: Use conventional commit messages (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`). Include a concise description of what changed and why. Multi-line bodies are encouraged for complex changes.
- **Summary of changes**: After completing each feature, update this document's "Implemented" section and commit the update.
- **Testing**: Run `npx next build` to verify no TypeScript or ESLint errors before committing.
- **Data changes**: Edit YAML files in `data/`, then run `pnpm db:push` (if schema changed) and `pnpm db:seed` to propagate.
- **Environment**: Requires `.env` with `DATABASE_URL` (Neon connection string). Future: Clerk keys, Anthropic key.
- **Cache issues**: If you see "Cannot find module" errors referencing old vendor chunks, delete the `.next` directory and restart the dev server.
- **Zsh**: The developer uses zsh, not bash.
