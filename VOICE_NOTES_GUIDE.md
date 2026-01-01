# Voice Notes Feature Guide

## Overview

The voice notes feature allows users to record audio directly within notes, automatically transcribing speech to text using OpenAI's Whisper API. Audio files are stored in Vercel Blob storage.

## Setup Requirements

### 1. Environment Variables

Add to your `.env` file:

```env
# Required: OpenAI API key for Whisper transcription
OPENAI_API_KEY=sk-...

# Required: Vercel Blob token for audio storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

**Getting Your Blob Token:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Storage → Blob
3. Create a new Blob store (if you don't have one)
4. Copy the `BLOB_READ_WRITE_TOKEN`

### 2. Database Migration

The database schema has already been updated with audio fields. Ensure your database is synced:

```bash
npx prisma migrate dev
# or if you have issues:
npx prisma migrate reset
```

### 3. Install Dependencies

Dependencies are already installed in `package.json`:
- `@vercel/blob` - Audio file storage
- `openai` - Whisper API integration

## How It Works

### Recording Flow

1. **User clicks "Voice Note" button** in the note editor
2. **Browser requests microphone permission** (first time only)
3. **Recording starts** with real-time waveform visualization
4. **User can preview** the recording before transcription
5. **Transcription is triggered** by clicking "Transcribe"
6. **Audio uploads to Vercel Blob** and Whisper processes it
7. **Transcribed text is added** to the note content
8. **Audio metadata is saved** with the note

### Technical Architecture

```
User → MediaRecorder API → VoiceNoteRecorder Component
                                    ↓
                            /api/ai/transcribe
                                    ↓
                        Vercel Blob ← → OpenAI Whisper
                                    ↓
                        Transcription + Audio URL
                                    ↓
                            Note Editor (updates content)
                                    ↓
                            /api/notes (saves to DB)
```

## Component Structure

### 1. VoiceNoteRecorder (`src/components/notes/voice-note-recorder.tsx`)

**Features:**
- Records audio using browser MediaRecorder API
- Real-time waveform visualization (40 bars)
- Format detection (WebM/MP4 fallback)
- 10-minute maximum duration
- Audio preview playback
- Calls transcription API

**Props:**
```typescript
{
  onTranscriptionComplete: (data: {
    transcription: string;
    audioUrl: string;
    audioSize: number;
    audioDuration: number;
  }) => void;
  onCancel?: () => void;
}
```

### 2. AudioPlayer (`src/components/notes/audio-player.tsx`)

**Features:**
- Play/pause controls
- Progress bar with seek functionality
- Volume control and mute toggle
- Download button
- Duration display
- Matches Editorial design system

**Props:**
```typescript
{
  audioUrl: string;
  duration?: number;
  className?: string;
}
```

### 3. API Route (`src/app/api/ai/transcribe/route.ts`)

**Endpoint:** `POST /api/ai/transcribe`

**Request:** FormData with `audio` file

**Validations:**
- Max file size: 10MB
- Allowed formats: WebM, MP4, MP3, WAV, OGG
- Authenticated user required

**Response:**
```json
{
  "transcription": "Transcribed text...",
  "language": "en",
  "audioUrl": "https://blob.vercel-storage.com/...",
  "audioSize": 1234567,
  "audioDuration": 45.2
}
```

## Database Schema

Audio fields added to `Note` model:

```prisma
model Note {
  // ... existing fields
  audioUrl           String?
  audioSize          Int?
  audioDuration      Float?
  transcriptionStatus String? @default("none")
}
```

**transcriptionStatus values:**
- `"none"` - No audio attached
- `"pending"` - Audio uploaded, transcription in progress
- `"completed"` - Transcription finished
- `"failed"` - Transcription error

## Testing Checklist

### Basic Functionality
- [ ] Click "Voice Note" button to open recorder
- [ ] Grant microphone permission
- [ ] Recording starts and waveform animates
- [ ] Stop recording after a few seconds
- [ ] Preview plays audio correctly
- [ ] Click "Transcribe" to process
- [ ] Transcription appears in note content
- [ ] Audio player shows below summary
- [ ] Save note with audio metadata
- [ ] Reload page - audio player still works

### Edge Cases
- [ ] Cancel recording (audio should not be saved)
- [ ] Record for 10 minutes (should hit limit)
- [ ] Record with no speech (should return empty/minimal text)
- [ ] Network error during upload (should show error toast)
- [ ] Invalid audio format (should show validation error)
- [ ] Large file size >10MB (should reject)

### Browser Compatibility
- [ ] Chrome/Edge (WebM with Opus)
- [ ] Safari (MP4 with AAC)
- [ ] Firefox (WebM with Opus)

## Costs & Limits

### OpenAI Whisper API
- **Model:** `whisper-1`
- **Cost:** $0.006 per minute
- **Example:** 5-minute recording = $0.03

### Vercel Blob Storage
- **Free tier:** 500GB bandwidth/month
- **Storage:** First 10GB free
- **Audio file size:** ~100KB per minute (WebM with Opus)

### Recommendations
- Limit recordings to 10 minutes (enforced)
- Average note: 2-3 minutes = ~$0.015 per voice note
- 1000 voice notes/month = ~$15-20

## Troubleshooting

### "Microphone permission denied"
- Check browser permissions: Settings → Privacy → Microphone
- Ensure HTTPS or localhost (required for MediaRecorder)

### "Failed to transcribe audio"
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI account has credits
- Ensure audio file is valid format

### "Failed to upload audio"
- Verify `BLOB_READ_WRITE_TOKEN` is set correctly
- Check Vercel Blob store is created
- Ensure file size is under 10MB

### "Audio player not working"
- Check `audioUrl` is accessible (CORS configured)
- Verify browser supports audio format
- Check browser console for errors

## Future Enhancements

- [ ] Add speaker diarization (identify multiple speakers)
- [ ] Support custom vocabulary for better accuracy
- [ ] Add language selection (Whisper supports 50+ languages)
- [ ] Implement streaming transcription for real-time feedback
- [ ] Add voice note search (search within transcriptions)
- [ ] Create voice note library/gallery view
- [ ] Add timestamps to transcription segments
- [ ] Support editing transcription text
- [ ] Add background noise reduction
- [ ] Implement offline recording with queue sync

## Example Usage

### Creating a Voice Note

```typescript
// In note editor
<VoiceNoteRecorder
  onTranscriptionComplete={(data) => {
    // Add transcription to note content
    setContent([
      ...content,
      { type: "p", children: [{ text: data.transcription }] }
    ]);
    
    // Save audio metadata
    setAudioUrl(data.audioUrl);
    setAudioSize(data.audioSize);
    setAudioDuration(data.audioDuration);
    setTranscriptionStatus("completed");
    
    // Trigger save
    setHasChanges(true);
  }}
  onCancel={() => setShowVoiceRecorder(false)}
/>
```

### Displaying Audio

```typescript
// In note editor or note card
{audioUrl && (
  <AudioPlayer 
    audioUrl={audioUrl} 
    duration={audioDuration} 
  />
)}
```

## Design Decisions

### Why Vercel Blob?
- Seamless integration with Next.js
- Automatic CDN distribution
- Simple token-based auth
- No separate infrastructure needed

### Why Whisper?
- State-of-the-art accuracy
- Supports 50+ languages
- Handles accents and background noise well
- Cost-effective for most use cases

### Why MediaRecorder?
- Native browser API (no external dependencies)
- Efficient compression (WebM/Opus)
- Low memory footprint
- Real-time audio processing

---

**Implementation Date:** January 2026  
**Status:** ✅ Complete and Ready for Testing
