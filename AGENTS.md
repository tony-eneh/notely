# Project Context for AI Assistants

This file helps AI assistants understand the Notely project structure, patterns, and conventions.

## Project Overview

**Notely** is an AI-powered note-taking application built with modern web technologies. It provides a rich text editing experience with intelligent features like text completion, semantic search, and automatic summarization.

**Key Capabilities:**
- Rich text note editing with Plate editor
- Hierarchical folder organization
- Tag-based categorization
- AI-powered writing assistance
- Semantic search across notes
- Automatic note summarization
- User authentication and data isolation

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 16.1.1 | React framework with App Router |
| **Language** | TypeScript | Latest | Type-safe development |
| **Editor** | Plate | 48.0.5 | Rich text editor framework |
| **UI Library** | Radix UI + shadcn/ui | Latest | Accessible component primitives |
| **Styling** | Tailwind CSS | Latest | Utility-first CSS |
| **Animation** | Framer Motion | 12.23.26 | Smooth animations |
| **Database** | PostgreSQL (via Prisma) | 6.19.1 | Data persistence |
| **ORM** | Prisma | 6.19.1 | Type-safe database access |
| **Auth** | Clerk | 6.36.5 | Authentication & user management |
| **AI** | OpenAI via Vercel AI SDK | 6.0.5 | AI features (completion, search, summarization) |

## Architecture Patterns

### 1. Next.js App Router Structure

```
app/
├── (auth)/          # Unauthenticated routes (sign-in, sign-up)
├── (dashboard)/     # Protected routes (notes, settings)
└── api/             # API routes (REST endpoints)
```

**Route Groups:** Use parentheses `(group)` for layout organization without affecting URL structure.

### 2. Authentication Flow

- **Provider:** Clerk handles all authentication
- **Middleware:** `src/middleware.ts` protects dashboard routes
- **User Sync:** Webhook at `/api/webhooks/clerk` syncs Clerk users to database
- **Auth Check:** All API routes use `await auth()` from `@clerk/nextjs/server`

### 3. Database Patterns

**Models:**
- `User` - Synced from Clerk (id matches Clerk user ID)
- `Note` - Rich content stored as JSON, plain text for search
- `Folder` - Hierarchical with self-referencing `parentId`
- `Tag` - Many-to-many relationship with Notes

**Key Conventions:**
- Use `cuid()` for IDs except User (uses Clerk ID)
- All user data has `userId` foreign key with cascade delete
- Timestamps: `createdAt`, `updatedAt` on all models
- Indexes on foreign keys and frequently queried fields

### 4. Data Flow Pattern

```
Client → API Route → Prisma → Database
                ↓
           Clerk Auth Check
```

**API Routes:**
- Always check `userId` from `await auth()`
- Return 401 if unauthorized
- Filter queries by `userId` to ensure data isolation
- Use Next.js `NextResponse` for JSON responses

### 5. Content Storage

Notes use **Plate editor** with structured JSON content:

```typescript
content: {
  type: 'p',           // Paragraph, heading, list, etc.
  children: [
    { text: 'content' }  // Leaf nodes contain text
  ]
}
```

**Important:** 
- Rich content stored in `content` field (JSON)
- Plain text extracted to `plainText` field for search
- Helper functions extract plain text from Plate JSON structure

## File Organization

### `/src/app` - Application Routes

- **(auth)/** - Sign-in/sign-up pages (Clerk components)
- **(dashboard)/** - Protected app pages
  - `notes/page.tsx` - Notes list view
  - `notes/[id]/page.tsx` - Individual note editor
  - `notes/new/page.tsx` - Create new note
  - `settings/page.tsx` - User settings
- **api/** - Backend API routes
  - `notes/` - CRUD operations for notes
  - `ai/` - AI features (complete, search, summarize)
  - `webhooks/clerk/` - User sync webhook

### `/src/components` - React Components

- **ui/** - shadcn/ui components (Button, Input, Dialog, etc.)
- **editor/** - Plate editor configuration and toolbar
- **layout/** - App shell (Sidebar, Header)
- **notes/** - Note-specific components (NoteCard, NoteList, NoteEditor)

### `/src/lib` - Utilities & Configuration

- `db.ts` - Prisma client singleton
- `ai.ts` - OpenAI client and model configuration
- `utils.ts` - General utilities (cn for classnames)

### `/src/hooks` - Custom React Hooks

- `use-notes.ts` - Notes data fetching and mutations
- `use-mobile.ts` - Responsive breakpoint detection
- `use-toast.ts` - Toast notification system

### `/src/types` - TypeScript Definitions

- `index.ts` - Shared type definitions matching Prisma models

## Key Conventions

### Code Style

1. **TypeScript:** Strict mode enabled, always type function parameters and returns
2. **Naming:**
   - Components: PascalCase (`NoteEditor.tsx`)
   - Files: kebab-case (`note-editor.tsx`)
   - Hooks: camelCase with `use` prefix (`useNotes`)
   - API routes: `route.ts` (Next.js convention)
3. **Imports:** Use `@/` alias for src directory imports
4. **React:** Use functional components with hooks (no class components)
5. **Async/Await:** Prefer over promises chains

### API Design

**Request/Response Pattern:**
```typescript
// POST /api/notes
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const body = await request.json();
  // ... process request
  
  return NextResponse.json({ data }, { status: 200 });
}
```

**Error Handling:**
```typescript
try {
  // operation
} catch (error) {
  console.error("[ROUTE_NAME]", error);
  return NextResponse.json(
    { error: "Error message" },
    { status: 500 }
  );
}
```

### Database Queries

**Always scope by userId:**
```typescript
const notes = await db.note.findMany({
  where: { userId },  // Always filter by authenticated user
  include: {
    folder: true,
    tags: true,
  },
});
```

**Cascade behavior:**
- Deleting User → deletes all Notes, Folders
- Deleting Folder → sets `folderId` to null on Notes
- Tags are shared across users (unique by name)

## AI Integration

### Available AI Features

1. **Text Completion** (`/api/ai/complete`)
   - Model: `gpt-4o-mini`
   - Streaming response
   - Continues user's writing naturally

2. **Semantic Search** (`/api/ai/search`)
   - Model: `text-embedding-3-small`
   - Uses embeddings + cosine similarity
   - Fallback to text search if `useAi: false`

3. **Summarization** (`/api/ai/summarize`)
   - Model: `gpt-4o-mini`
   - Generates 2-4 sentence summaries
   - Optional database persistence

### AI Configuration

Located in `src/lib/ai.ts`:
```typescript
export const defaultModel = openai("gpt-4o-mini");
export const advancedModel = openai("gpt-4o");
export const embeddingModel = openai.embedding("text-embedding-3-small");
```

## Environment Variables

Required environment variables:
```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# AI
OPENAI_API_KEY="sk-..."

# URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
```

## Common Tasks for AI Assistants

### When Adding a New Feature

1. **Database changes:** Update `prisma/schema.prisma` → Run `npx prisma migrate dev`
2. **API route:** Create in `src/app/api/[feature]/route.ts` with auth check
3. **Types:** Update `src/types/index.ts` to match Prisma schema
4. **UI component:** Create in appropriate `src/components/` subdirectory
5. **Hook (if needed):** Add data fetching/mutation logic to `src/hooks/`

### When Debugging

1. **Check auth:** Ensure `userId` is properly checked in API routes
2. **Prisma logs:** Enable with `log: ['query']` in db.ts
3. **Console prefixes:** Look for `[ROUTE_NAME]` in logs
4. **Type errors:** Run `npx tsc --noEmit` to check TypeScript errors
5. **Database sync:** Run `npx prisma db push` if schema is out of sync

### When Modifying the Editor

- Plate configuration is in `src/components/editor/plugins.ts`
- Toolbar in `src/components/editor/toolbar.tsx`
- Content extraction helpers are inline in API routes
- Always test with various content types (headings, lists, code blocks)

### When Working with Styles

- Use Tailwind utility classes
- Use `cn()` utility from `src/lib/utils.ts` for conditional classes
- shadcn/ui components are in `src/components/ui/`
- Global styles in `src/app/globals.css`

## Important Files to Reference

- **Database schema:** `prisma/schema.prisma`
- **Type definitions:** `src/types/index.ts`
- **Middleware (auth):** `src/middleware.ts`
- **AI config:** `src/lib/ai.ts`
- **DB client:** `src/lib/db.ts`
- **Project plan:** `PLAN.md`

## Testing Considerations

- Test with authenticated user context
- Verify data isolation between users
- Test editor with various content types
- Check responsive design (mobile/desktop)
- Validate AI features with real OpenAI API key

## Notes for Development

- **Hot reload:** Next.js auto-reloads on file changes
- **Database changes:** Always run migrations after schema changes
- **Environment:** Ensure all env vars are set (check `.env.example` if it exists)
- **Clerk setup:** Webhooks must be configured in Clerk dashboard
- **AI costs:** OpenAI API calls incur costs, use judiciously during development

---

**Last Updated:** January 2026  
**Project Status:** Active Development
