# WebSocket Integration for ElevenLabs Scribe v2

## ✅ Installed Components

The entire infrastructure for WebSocket and ElevenLabs Scribe v2 is installed and ready for use.

## 📦 Installed Packages

- `ws` - WebSocket library for Node.js
- `@types/ws` - TypeScript types for ws

## 🗂️ Created Files

### 1. **React Hook for Recording**

[src/hooks/useScribeRecording.ts](src/hooks/useScribeRecording.ts)

Custom hook to work with ElevenLabs Scribe WebSocket API:

- Connects to WebSocket
- Records audio from microphone
- Real-time transcription
- Handles partial and finalized transcripts
- Automatic audio conversion to PCM16 format

**Usage:**

```typescript
const {
  isConnected,
  isRecording,
  partialTranscript,
  committedTranscripts,
  error,
  startRecording,
  stopRecording,
} = useScribeRecording({
  modelId: "scribe_v2_realtime", // Correct model ID for Scribe v2
  sampleRate: 16000,
  commitStrategy: "vad",
});
```

### 2. **Recording Component**

[src/components/ScribeRecorder.tsx](src/components/ScribeRecorder.tsx)

UI component with full functionality:

- Record/stop button
- Real-time transcription display
- Display of finalized transcripts
- Error handling
- Statistics (word count, segment count)

### 3. **API Route for Token Generation**

[src/app/api/elevenlabs-token/route.ts](src/app/api/elevenlabs-token/route.ts)

Protected endpoint for generating one-time tokens:

- Authentication check via NextAuth
- Generates single-use token via ElevenLabs API
- Secure: API key remains on the server, client receives only the token
- Token is valid for only one WebSocket connection

### 4. **Integration in Recordings Page**

[src/app/dashboard/recordings/page.tsx](src/app/dashboard/recordings/page.tsx)

The ScribeRecorder component is integrated into the recordings page.

### 5. **Proxy API Route (Optional)**

[src/app/api/scribe/route.ts](src/app/api/scribe/route.ts)

Server-side proxy for WebSocket connections (for future use).

## ⚙️ Configuration

### Environment Variables

Add to [.env.local](.env.local):

```env
ELEVENLABS_API_KEY=your_actual_api_key_here
```

The [.env.local.example](.env.local.example) file contains a template.

## 🚀 How to Use

### Step 1: Get ElevenLabs API Key

1. Register at https://elevenlabs.io
2. Go to Settings → API Keys
3. Create a new API key
4. Copy the key

### Step 2: Add API Key to .env.local

```bash
ELEVENLABS_API_KEY=sk_your_actual_elevenlabs_api_key
```

### Step 3: Run the Application

```bash
npm run dev
```

### Step 4: Test Recording

1. Open http://localhost:3000/dashboard/recordings
2. Log in
3. Click the microphone button
4. Allow microphone access
5. Speak - transcription will appear in real-time!

## 🔧 Technical Details

### WebSocket Endpoint

```
wss://api.elevenlabs.io/v1/speech-to-text/realtime
```

**Parameters:**

- `model_id` - Model ID (**scribe_v2_realtime** - the only supported model)
- `commit_strategy` - "manual" or "vad" (voice activity detection)
- `include_timestamps` - include timestamps
- `include_language_detection` - auto-detect language
- `sample_rate` - sample rate (16000 recommended)

### Audio Formats

- **PCM 16kHz** (recommended) - optimal balance of quality and bandwidth
- Supported: pcm_8000, pcm_16000, pcm_22050, pcm_24000, pcm_44100, pcm_48000, ulaw_8000
- Mono audio only

### Message Types

**Client to Server:**

```json
{
  "type": "input_audio_chunk",
  "audio_base_64": "...",
  "commit": false,
  "sample_rate": 16000
}
```

**Server to Client:**

- `session_started` - connection established
- `partial_transcript` - intermediate transcription
- `committed_transcript` - final transcription
- `committed_transcript_with_timestamps` - with timestamps
- `error`, `auth_error`, `quota_exceeded`, `rate_limited` - errors

## 🌍 Regional Servers

- **US:** `wss://api.us.elevenlabs.io/v1/speech-to-text/realtime`
- **EU:** `wss://api.eu.residency.elevenlabs.io/v1/speech-to-text/realtime`
- **India:** `wss://api.in.residency.elevenlabs.io/v1/speech-to-text/realtime`

## 📊 Scribe v2 Features

- ⚡ **Latency:** ~150ms
- 🌐 **Languages:** 90+ languages, including English, French, German, Italian, Spanish, Portuguese
- 🔄 **Auto-Language Switching** mid-conversation
- 🎯 **Word Prediction** with "negative latency"
- 📝 **Contextual Transcription** using previous batches

## 🔐 Security

- API key is stored on the server (in .env.local) and **never transmitted to the client**
- Server generates one-time tokens via ElevenLabs API
- Client uses token for WebSocket connection
- Token is valid for only one connection (single-use)
- Only authorized users can obtain a token

## 🐛 Troubleshooting

### Error "No API key available"

- Check that `ELEVENLABS_API_KEY` is added to .env.local
- Restart dev server

### Error "Authentication error"

- Check API key correctness
- Ensure you have an active ElevenLabs subscription

### Microphone not working

- Allow microphone access in the browser
- Use HTTPS (or localhost for development)

### WebSocket not connecting

- Check internet connection
- Check firewall settings
- Ensure WebSocket is not blocked by proxy

## 📚 Resources

- [ElevenLabs Scribe v2 Realtime API](https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime)
- [Realtime Speech to Text Cookbook](https://elevenlabs.io/docs/cookbooks/speech-to-text/streaming)
- [Next.js WebSocket Integration Guide](https://github.com/vercel/next.js/discussions/14950)

## 🎯 Next Steps

1. ✅ WebSocket infrastructure ready
2. 🔄 Add transcript saving to Supabase
3. 🔄 Add toxicity/threat analysis on transcripts
4. 🔄 Add recording export in various formats
5. 🔄 Add recording history with search
