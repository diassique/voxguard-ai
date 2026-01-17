import { NextRequest } from "next/server";
import WebSocket from "ws";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const upgradeHeader = req.headers.get("upgrade");

  if (upgradeHeader !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response("Server configuration error", { status: 500 });
  }

  // Get query parameters from the request
  const { searchParams } = new URL(req.url);
  const modelId = searchParams.get("model_id") || "eleven_turbo_v2_5";
  const commitStrategy = searchParams.get("commit_strategy") || "vad";
  const includeTimestamps = searchParams.get("include_timestamps") || "true";
  const languageDetection = searchParams.get("include_language_detection") || "true";
  const sampleRate = searchParams.get("sample_rate") || "16000";

  // Build ElevenLabs WebSocket URL
  const elevenLabsUrl = `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=${modelId}&commit_strategy=${commitStrategy}&include_timestamps=${includeTimestamps}&include_language_detection=${languageDetection}`;

  try {
    // Create WebSocket connection to ElevenLabs
    const elevenLabsWs = new WebSocket(elevenLabsUrl, {
      headers: {
        "xi-api-key": apiKey,
      },
    });

    // Note: In Next.js API routes, we need to handle WebSocket upgrade differently
    // This route serves as a reference - for production, consider using a separate WebSocket server
    // or a library like next-ws for proper WebSocket handling in Next.js

    elevenLabsWs.on("open", () => {
      console.log("Connected to ElevenLabs Scribe");
    });

    elevenLabsWs.on("message", (data) => {
      // Forward messages from ElevenLabs to client
      console.log("Received from ElevenLabs:", data.toString());
    });

    elevenLabsWs.on("error", (error) => {
      console.error("ElevenLabs WebSocket error:", error);
    });

    elevenLabsWs.on("close", () => {
      console.log("Disconnected from ElevenLabs");
    });

    return new Response("WebSocket proxy initiated", { status: 101 });
  } catch (error) {
    console.error("Failed to connect to ElevenLabs:", error);
    return new Response("Connection failed", { status: 500 });
  }
}
