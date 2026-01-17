import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// =============================================================================
// Rate Limiting for ElevenLabs Token Generation
//
// IMPORTANT: ElevenLabs single-use tokens can only be used ONCE.
// We cannot cache them - each WebSocket connection needs a fresh token.
// Instead, we implement rate limiting to prevent abuse.
// =============================================================================

// Rate limiting: sliding window counter per user
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Allow 10 token requests per minute per user (generous for reconnects)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

// Minimum interval between requests (prevents burst requests)
const MIN_REQUEST_INTERVAL_MS = 500; // 500ms
const lastRequestTime = new Map<string, number>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;

  // Cleanup old rate limit entries
  rateLimitMap.forEach((entry, usrId) => {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(usrId);
    }
  });

  // Cleanup old request time entries
  lastRequestTime.forEach((time, usrId) => {
    if (now - time > 60000) {
      lastRequestTime.delete(usrId);
    }
  });
}

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();

  // Check minimum interval
  const lastRequest = lastRequestTime.get(userId) || 0;
  if (now - lastRequest < MIN_REQUEST_INTERVAL_MS) {
    return { allowed: false, retryAfter: MIN_REQUEST_INTERVAL_MS - (now - lastRequest) };
  }

  // Check sliding window rate limit
  let entry = rateLimitMap.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // Start new window
    entry = { count: 0, windowStart: now };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfter };
  }

  // Update counters
  entry.count++;
  rateLimitMap.set(userId, entry);
  lastRequestTime.set(userId, now);

  return { allowed: true };
}

export async function GET(request: NextRequest) {
  try {
    // Run periodic cleanup
    cleanup();

    // Create Supabase server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Not needed for GET request
          },
        },
      }
    );

    // Check authentication via Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("⚠️ Unauthorized request to /api/elevenlabs-token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Check rate limit
    const rateLimitResult = checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      console.warn(`⚠️ Rate limited user ${user.email} - too many requests`);
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment.",
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimitResult.retryAfter || 1000) / 1000)),
          },
        }
      );
    }

    // Get API key
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.error("❌ ELEVENLABS_API_KEY not found in environment variables");
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    console.log("🔑 Generating new token for user:", user.email);

    // Generate single-use token for client-side WebSocket
    // NOTE: These tokens can only be used ONCE - no caching possible
    const tokenResponse = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ Failed to generate token:", tokenResponse.status, errorText);

      // If rate limited by ElevenLabs, return appropriate error
      if (tokenResponse.status === 429) {
        return NextResponse.json(
          { error: "ElevenLabs rate limit reached. Please wait a moment." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Failed to generate token: ${tokenResponse.status}` },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log("✅ Token generated successfully");

    return NextResponse.json({ token: tokenData.token });
  } catch (error) {
    console.error("❌ Error in /api/elevenlabs-token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
