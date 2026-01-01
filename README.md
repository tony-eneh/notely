This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Required services:**
- **Clerk** (authentication): Get keys from [dashboard.clerk.com](https://dashboard.clerk.com)
- **Supabase** (database): Get connection strings from your Supabase project
- **OpenAI** (AI features): Get API key from [platform.openai.com](https://platform.openai.com)
- **Vercel Blob** (voice notes): Get token from [vercel.com/dashboard/stores](https://vercel.com/dashboard/stores)
- **VAPID keys** (push notifications): Generate with:
  ```bash
  npx web-push generate-vapid-keys
  ```

### 3. Setup Database

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Features

- 📝 Rich text editing with Plate editor
- 🤖 AI-powered text completion and summarization
- 🎙️ Voice notes with automatic transcription (Whisper)
- 🔍 Semantic search across notes
- 📱 Progressive Web App (installable, offline support)
- 🔔 Push notifications
- 🔗 Web Share Target (receive shared content from other apps)
- 🌐 Background sync for offline edits

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
