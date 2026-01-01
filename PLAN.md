# AI-Powered Note-Taking App - Implementation Plan

## Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | NextJS 15 (App Router) | Full-stack React framework |
| **Editor** | Plate | Rich text editor with AI integration |
| **UI** | shadcn/ui + Tailwind CSS + Framer Motion | Beautiful, minimal design |
| **Database** | Supabase (PostgreSQL) | Data storage + real-time |
| **ORM** | Prisma | Type-safe database access |
| **Auth** | Clerk | Authentication & user management |
| **AI** | Vercel AI SDK + OpenAI | AI features |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with Clerk provider
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles
│   ├── (auth)/                 # Auth routes (Clerk handles UI)
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── notes/
│   │   │   ├── page.tsx        # Notes list
│   │   │   └── [id]/page.tsx   # Individual note editor
│   │   └── settings/page.tsx   # User settings
│   └── api/
│       ├── notes/route.ts      # Notes CRUD
│       ├── ai/
│       │   ├── complete/route.ts    # Autocomplete
│       │   ├── summarize/route.ts   # Summarization
│       │   └── search/route.ts      # Smart search
│       └── webhooks/clerk/route.ts  # Clerk webhook for user sync
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── editor/                 # Plate editor components
│   │   ├── plate-editor.tsx
│   │   ├── toolbar.tsx
│   │   └── plugins.ts
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── note-list.tsx
│   └── ai/
│       ├── ai-autocomplete.tsx
│       ├── ai-summarize.tsx
│       └── ai-search.tsx
├── lib/
│   ├── db.ts                   # Prisma client
│   ├── ai.ts                   # AI utilities
│   └── utils.ts                # General utilities
├── hooks/
│   ├── use-notes.ts
│   └── use-ai.ts
└── types/
    └── index.ts
```

## Database Schema (Prisma)

```prisma
model User {
  id        String   @id                    // Clerk user ID
  email     String   @unique
  name      String?
  imageUrl  String?
  notes     Note[]
  folders   Folder[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Note {
  id        String   @id @default(cuid())
  title     String   @default("Untitled")
  content   Json?                           // Plate JSON content
  summary   String?                         // AI-generated summary
  embedding Unsupported("vector(1536)")?    // For smart search
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  folderId  String?
  folder    Folder?  @relation(fields: [folderId], references: [id])
  tags      Tag[]
  isFavorite Boolean @default(false)
  isArchived Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([folderId])
}

model Folder {
  id        String   @id @default(cuid())
  name      String
  icon      String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  notes     Note[]
  parentId  String?
  parent    Folder?  @relation("FolderHierarchy", fields: [parentId], references: [id])
  children  Folder[] @relation("FolderHierarchy")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model Tag {
  id    String @id @default(cuid())
  name  String
  color String @default("#6366f1")
  notes Note[]

  @@unique([name])
}
```

## AI Features Implementation

### 1. Autocomplete (Priority: High)
- Trigger: User pauses typing or presses keyboard shortcut (Ctrl+Space)
- Implementation: Stream completions using Vercel AI SDK
- UX: Ghost text appears, Tab to accept

### 2. Summarization (Priority: High)
- Trigger: Button click or command palette
- Implementation: Generate summary, store in database
- UX: Summary appears in sidebar or modal

### 3. Smart Search (Priority: Medium)
- Implementation: Generate embeddings on note save, use pgvector for similarity search
- UX: Semantic search results ranked by relevance

## Implementation Phases

### Phase 1: Foundation ✓
- [x] Create NextJS project with TypeScript
- [x] Setup Tailwind CSS and shadcn/ui
- [x] Configure Clerk authentication
- [x] Setup Prisma with Supabase
- [x] Create database schema

### Phase 2: Core Features ✓
- [x] Build dashboard layout with sidebar
- [x] Implement Plate rich text editor
- [x] Create notes CRUD API routes
- [x] Build note list and editor pages

### Phase 3: AI Integration ✓
- [x] Setup Vercel AI SDK with OpenAI
- [x] Implement autocomplete feature
- [x] Implement summarization feature
- [x] Implement smart search with embeddings

### Phase 4: Voice Notes (In Progress)
- [ ] Setup Vercel Blob storage for audio files
- [ ] Update database schema with audio fields
- [ ] Create audio transcription API (OpenAI Whisper)
- [ ] Build voice recorder component
- [ ] Integrate voice notes into editor
- [ ] Add audio playback UI

### Phase 5: Polish (Future)
- [ ] Add animations with Framer Motion
- [ ] Implement dark/light theme
- [ ] Add keyboard shortcuts
- [ ] Mobile responsive design

## Voice Notes Feature Specifications

### Technical Implementation
- **Audio Storage**: Vercel Blob (encrypted, secure URLs)
- **Transcription**: OpenAI Whisper API (auto-detects language, supports 99 languages)
- **Recording Limits**: Maximum 10 minutes per recording
- **Supported Formats**: WebM (Chrome/Edge), MP4 (Safari), MP3 (fallback)
- **Audio Processing**: Browser MediaRecorder API, no external dependencies

### Database Schema Updates
```prisma
model Note {
  // ... existing fields
  audioUrl         String?   // Vercel Blob URL
  audioSize        Int?      // File size in bytes
  audioDuration    Float?    // Duration in seconds
  transcriptionStatus String? @default("none") // none, processing, completed, failed
}
```

### API Endpoints
- `POST /api/ai/transcribe` - Upload audio, transcribe with Whisper
- `POST /api/notes` - Extended to accept audioUrl field

### User Experience
- Voice recorder button in note editor toolbar
- Real-time recording visualization (waveform)
- Audio preview before creating note
- Transcription progress indicator
- Audio player attached to notes with recordings
- Auto-save transcribed text to editor

### Cost Considerations
- Whisper API: $0.006/minute of audio
- Vercel Blob: Free tier 500GB/month, then $0.15/GB
- No usage limits initially (to be added if needed)

### Phase 4: Polish (Future)
- [ ] Add animations with Framer Motion
- [ ] Implement dark/light theme
- [ ] Add keyboard shortcuts
- [ ] Mobile responsive design

## Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/notes
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/notes

# Supabase
DATABASE_URL=
DIRECT_URL=

# OpenAI
OPENAI_API_KEY=

# Vercel Blob (for voice notes)
BLOB_READ_WRITE_TOKEN=
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Setup database
pnpm prisma generate
pnpm prisma db push

# Run development server
pnpm dev
```
