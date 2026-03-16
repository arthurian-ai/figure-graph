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
- **Full dance graph view**: React Flow visualization with Dagre hierarchical layout (top-to-bottom), level-grouped nodes with colored borders
- **Local figure graph view**: Center figure with glow effect, precedes stacked on left, follows stacked on right. Figures grouped by level within each side with extra spacing between groups.
- **Graph traversal**: Clicking a node in local graph view navigates to that node's local graph
- **Level filter toggles**: Bronze/Silver/Gold toggle buttons to show/hide figures by exam level in both graph views
- **Search and filter**: Search input on dance detail page filters figures by name; level toggles for filtering
- **Authentication**: Clerk integration with OAuth (Google, GitHub, Apple, Microsoft)
- **Routine builder**: Full drag-and-drop builder with @dnd-kit, searchable figure sidebar, wall segment selection, notes per entry
- **User figure notes**: Personal notes on figure detail page with CRUD via tRPC mutations
- **Client-side navigation**: All internal links use Next.js `<Link>` for SPA-like navigation
- **Dark theme**: oklch-based color system with ISTD level colors — Bronze (#CD7F32), Silver (#C0C0C0), Gold (#FFD700)

### Design Decisions
- **Server components over tRPC for reads**: Pages use `getDb()` directly in async server components instead of tRPC, avoiding client-side data fetching overhead. tRPC is reserved for future client-side mutations.
- **Lazy DB connection**: `src/db/index.ts` uses a Proxy to defer Neon initialization until first query, preventing build-time errors when DATABASE_URL isn't available.
- **Leader/Follower terminology**: Replaced traditional man/lady with leader/follower throughout data and UI.
- **YAML as source of truth**: The database is fully rebuildable from YAML files. Manual edits go in YAML, then `pnpm db:seed` propagates changes.

## Planned Features

All features have been implemented! 🎉

The following features were completed in this iteration:

### 1. Full Graph View Layout Improvement ✅ COMPLETED
- Replaced simple row-based layout with Dagre hierarchical layout (top-to-bottom)
- Level grouping now visual via node colors, not spatial grouping
- Edges route cleanly with reduced crossing

### 2. Search and Filter on Figure List Pages ✅ COMPLETED
- Added search input to dance detail page filtering figures by name
- Added level filter toggles (Bronze/Silver/Gold) matching graph view style
- Client-side filtering for instant feedback

### 3. Authentication (Clerk with OAuth) ✅ COMPLETED
- Integrated @clerk/nextjs
- Enabled OAuth: Google, GitHub, Apple, Microsoft
- Added sign-in/sign-up buttons to navigation
- Protected routine and note routes with middleware
- User sync to `users` table on first sign-in

### 4. Routine Builder ✅ COMPLETED
- Full drag-and-drop builder with @dnd-kit
- Searchable figure sidebar
- Drag-and-drop sequence reordering
- Wall segment selection per entry (long1/short1/long2/short2)
- Notes field per entry
- tRPC mutations for save/update

### 5. User Figure Notes ✅ COMPLETED
- Added personal notes section to figure detail page
- CRUD operations via tRPC mutations
- Plaintext notes, authenticated users only

---

*Project Status: All planned features implemented as of 2026-03-16*

- **Commits**: Use conventional commit messages (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`). Include a concise description of what changed and why. Multi-line bodies are encouraged for complex changes.
- **Summary of changes**: After completing each feature, update this document's "Implemented" section and commit the update.
- **Testing**: Run `npx next build` to verify no TypeScript or ESLint errors before committing.
- **Data changes**: Edit YAML files in `data/`, then run `pnpm db:push` (if schema changed) and `pnpm db:seed` to propagate.
- **Environment**: Requires `.env` with `DATABASE_URL` (Neon connection string). Future: Clerk keys, Anthropic key.
- **Cache issues**: If you see "Cannot find module" errors referencing old vendor chunks, delete the `.next` directory and restart the dev server.
- **Zsh**: The developer uses zsh, not bash.
