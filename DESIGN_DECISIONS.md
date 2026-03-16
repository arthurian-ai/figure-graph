# Design Decisions

This document captures architectural decisions made during the development of the Figure Graph project.

## 1. Server Components over tRPC for Reads

**Decision**: Pages use server components that query the database directly via Drizzle ORM instead of using tRPC for data fetching.

**Rationale**:
- Server components in Next.js App Router already run on the server
- Direct DB queries avoid unnecessary client-side data fetching overhead
- Simpler data flow: component → DB → render
- tRPC remains available for future client-side mutations

**Trade-offs**:
- Less type-safe data sharing between client/server compared to tRPC
- No automatic request batching that tRPC provides

## 2. Lazy Database Connection via Proxy Pattern

**Decision**: Database connection is initialized lazily using a Proxy to defer Neon initialization until first query.

**Rationale**:
- Prevents build-time errors when `DATABASE_URL` isn't set during `next build`
- Works seamlessly with Vercel/Neon serverless deployment model
- Connection is established only when needed at runtime

**Implementation**: `src/db/index.ts` uses a Proxy around the Drizzle connection.

## 3. Leader/Follower Terminology

**Decision**: Replaced traditional "man/lady" terminology with "leader/follower" throughout data and UI.

**Rationale**:
- More inclusive and modern terminology
- Better reflects contemporary partner dancing
- Consistent with current dance industry standards

## 4. YAML as Source of Truth

**Decision**: The `data/` directory contains YAML files that are the authoritative source. The database is a derived artifact rebuildable via `pnpm db:seed`.

**Rationale**:
- Human-editable source files for manual corrections
- Version control friendly
- Clear separation between data extraction and application
- Easy to regenerate DB after schema changes or data fixes

**Trade-offs**:
- Requires running seed script to sync changes
- Edge matching uses fuzzy matching (~77% success rate)

## 5. Dagre for Hierarchical Graph Layout

**Decision**: Used Dagre (`@dagrejs/dagre`) for the full graph view layout algorithm.

**Rationale**:
- Well-established library for directed graph layout
- Supports hierarchical (TB/LR) layouts out of the box
- Lighter weight than ELK.js
- Good integration with React Flow

**Configuration**:
- `rankdir: "TB"` - Top to bottom layout
- `nodesep: 80` - Horizontal node separation
- `ranksep: 150` - Vertical rank separation

## 6. Clerk Authentication Integration

**Decision**: Integrated Clerk (`@clerk/nextjs`) for authentication with OAuth support.

**Rationale**:
- Well-supported Next.js App Router integration
- Built-in OAuth providers (Google, GitHub, Apple, Microsoft)
- Handles user management, sessions, security out of the box
- `users` table uses Clerk's user ID as PK for easy sync

**Implementation**:
- `<ClerkProvider>` wrapper in root layout
- `middleware.ts` for route protection
- OAuth sign-in/sign-up buttons in navigation

## 7. Drag-and-Drop Routine Builder with @dnd-kit

**Decision**: Built routine builder using `@dnd-kit/core` for drag-and-drop functionality.

**Rationale**:
- Modern, accessible drag-and-drop library
- Supports keyboard interactions
- Works well with React state management
- Lightweight compared to alternatives

**Features**:
- Searchable figure sidebar
- Ordered sequence with reordering
- Wall segment selection per entry
- Notes field per entry

## 8. tRPC for Mutations Only

**Decision**: tRPC is used for write operations (routines, notes) while reads remain via server components.

**Rationale**:
- Client-side interactions need type-safe API
- Server components already handle initial data load
- Maintains consistency with existing patterns

## 9. Level-Based Filtering (Bronze/Silver/Gold)

**Decision**: Level filtering is implemented as client-side state with toggle buttons.

**Rationale**:
- All figures already loaded via server component
- Instant feedback without server round-trips
- Consistent UI pattern across graph and list views

## 10. User Figure Notes (Personal Notes)

**Decision**: Personal notes on figures are stored in `figure_notes` table with CRUD via tRPC mutations.

**Rationale**:
- User-specific data requires authentication
- Simple plaintext storage (no rich text initially)
- Extends existing figure detail page naturally

---

*Last updated: 2026-03-16 — All planned features from PROJECT_STATUS.md completed*
