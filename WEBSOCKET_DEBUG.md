# WebSocket Debugging Guide

## 🐛 Issue: Infinite Spinner on Record Button

### ✅ Fixes Applied:

1. **Pass API key via query parameter** instead of header
   - Browser WebSocket cannot send custom headers
   - Now uses `?xi-api-key=...` in URL

2. **Improved Logging**
   - API endpoint logs all requests
   - WebSocket logs all connection stages
   - Errors are output in detail to the console

3. **Error Handling**
   - Check HTTP response status from API
   - Detailed information about WebSocket connection closure
   - Clear error messages for the user

## 🔍 How to Verify It Works:

1. **Open Chrome DevTools** (F12)
2. Go to the **Console** tab
3. Refresh the page `/dashboard/recordings`
4. Click the record button (microphone)

### Expected Logs:

```
🔄 Fetching API key from backend...
✅ API key provided to user: your@email.com
✅ API key received, connecting to WebSocket...
✅ Connected to ElevenLabs Scribe WebSocket
```

### If You See Errors:

#### ❌ "Unauthorized"

**Issue:** User is not logged in
**Solution:** Log in via Google

#### ❌ "ELEVENLABS_API_KEY not found"

**Issue:** API key is not configured in .env.local
**Solution:**

1. Check that [.env.local](.env.local#L9) has the key
2. Restart dev server

#### ❌ "Connection closed unexpectedly (code: 1006)"

**Issue:** WebSocket cannot connect to ElevenLabs
**Possible Causes:**

- Invalid API key
- Network/firewall issues
- API key does not have Scribe API permissions

**Solution:**

1. Check API key validity on elevenlabs.io
2. Ensure you have an active subscription with Scribe v2 access
3. Check Network tab in DevTools - there should be a WS request

#### ❌ "Failed to connect: HTTP 401/403"

**Issue:** Invalid or expired API key
**Solution:** Generate a new key on elevenlabs.io

## 🧪 Testing Connection

### 1. Check API Endpoint

Open in browser (after logging in):

```
http://localhost:3000/api/elevenlabs-token
```

Should return:

```json
{ "apiKey": "your_key" }
```

### 2. Check WebSocket in Console

Copy to browser console:

```javascript
const ws = new WebSocket(
  "wss://api.elevenlabs.io/v1/speech-to-text/realtime?xi-api-key=YOUR_KEY&model_id=eleven_turbo_v2_5",
);
ws.onopen = () => console.log("✅ Connected");
ws.onerror = (e) => console.error("❌ Error", e);
ws.onmessage = (e) => console.log("📨 Message:", e.data);
```

Replace `YOUR_KEY` with your key from .env.local

## 📊 Network Tab Check

1. Open DevTools → **Network** tab
2. Filter: **WS** (WebSocket)
3. Click record button
4. Request to `api.elevenlabs.io` should appear
5. Status: **101 Switching Protocols** (success)

### If Status 401/403:

- Check API key
- Check subscription on elevenlabs.io

### If Request Does Not Appear:

- Check console for errors
- Check that API endpoint returns key

## 🔧 Quick Fixes

### Restart Dev Server

After changing .env.local **always** restart:

```bash
# Ctrl+C in terminal
npm run dev
```

### Clear Browser Cache

1. DevTools → Application → Storage
2. Clear site data
3. Refresh page (F5)

### Check Microphone Permissions

1. Address bar → lock icon
2. Site settings → Microphone → Allow

## 📝 Console Logs

### Successful Connection:

```
🔄 Fetching API key from backend...
✅ API key provided to user: user@example.com
✅ API key received, connecting to WebSocket...
✅ Connected to ElevenLabs Scribe WebSocket
```

### Auth Error:

```
⚠️ Unauthorized request to /api/elevenlabs-token
❌ Failed to connect: Unauthorized
```

### Configuration Error:

```
❌ ELEVENLABS_API_KEY not found in environment variables
❌ Failed to connect: ElevenLabs API key not configured
```

### WebSocket Error:

```
❌ WebSocket error: [event object]
🔌 Disconnected from ElevenLabs { code: 1006, reason: '', wasClean: false }
```

## 🎯 Next Steps After Fix

1. Check all logs in console
2. Ensure WebSocket connects
3. Click microphone and start speaking
4. Transcription should appear in real-time

## 🐛 Issue: Partial Transcripts Not Showing

### Symptoms:

- Transcription appears only after a pause
- Yellow "Real-time (partial)" window is not shown
- Console shows `🟡 Partial transcript: undefined`

### ✅ Solution:

ElevenLabs sends partial transcripts with `text` field, not `partial_transcript`.

**Code Fix:**

```typescript
case "partial_transcript":
  // Use message.text instead of message.partial_transcript
  setPartialTranscript(message.text || message.partial_transcript || "");
  break;
```

### Verification:

1. Open console (F12)
2. Start recording and speak
3. Should see logs: `🟡 Partial transcript message: {...}`
4. UI should show yellow window with real-time text

### How It Works:

- **Partial transcripts** - update real-time during speech (yellow window)
- **Committed transcripts** - final version after pause (green window)
- Both use `message.text` field

---

## 🐛 Issue: WebSocket Disconnects After Pause

### Symptoms:

- See `🔌 Disconnected from ElevenLabs {code: 1005, reason: '', wasClean: true}`
- Connection drops after speech pause
- Reconnection required

### ✅ This is Normal Behavior!

ElevenLabs **automatically closes WebSocket** after:

1. Voice Activity Detection (VAD) detects end of speech
2. Sends final `committed_transcript`
3. Closes connection (code 1000 or 1005)

**Close Codes:**

- `1000` = Normal Closure
- `1005` = No Status Received (also normal for VAD)

**Solution:**
System automatically reconnects with exponential backoff. This is expected behavior when using `commitStrategy: "vad"`.

**If you don't want automatic disconnects:**
Change strategy to `manual`:

```typescript
commitStrategy: "manual";
```

You will need to manually send commit via `sendAudioChunk(data, true)`.

---

## 🐛 Issue: Next.js Console Error on WebSocket Error

### Symptoms:

- Red error in Next.js console: `❌ WebSocket error: {}`
- Error occurs when switching pages
- Or when closing page during connection

### ✅ Solution:

Using **best practice** - completely removed logging from `error` event listener, because:

1. WebSocket `error` event contains no useful info
2. All error details come in `close` event (code, reason, wasClean)
3. Logging Event object causes serialization errors in Next.js

**New Approach:**

```typescript
ws.addEventListener("error", () => {
  // Error event doesn't contain useful info - details come in 'close' event
  // Just update state, NO logging here
  setIsConnected(false);
  setConnectionState("error");
});

ws.addEventListener("close", (event) => {
  // This is where we get actual error details
  const isError =
    !event.wasClean || (event.code !== 1000 && event.code !== 1005);

  if (isError) {
    console.error("❌ WebSocket closed with error", {
      code: event.code,
      reason: event.reason || "No reason provided",
      wasClean: event.wasClean,
    });
  } else {
    console.log("🔌 WebSocket closed normally", {
      code: event.code,
      reason: event.reason || "Session ended",
    });
  }
});
```

Also added WebSocket state check before closing:

```typescript
if (
  wsRef.current.readyState === WebSocket.OPEN ||
  wsRef.current.readyState === WebSocket.CONNECTING
) {
  try {
    wsRef.current.close();
  } catch (err) {
    console.warn("WebSocket close error during cleanup:", err);
  }
}
```

---

## 💡 Additional Info

- ElevenLabs Scribe supports 90+ languages
- Latency ~150ms
- Voice Activity Detection (VAD) automatically detects end of phrase
- API key passed via query parameter for browser compatibility
- Single-use tokens used for secure client connection
- WebSocket automatically closes after VAD commit (normal behavior)
- WebSocket safely closes on page navigation
