import { NextRequest, NextResponse } from "next/server";

// ElevenLabs Batch Speech-to-Text API
// https://elevenlabs.io/docs/api-reference/speech-to-text

export async function POST(request: NextRequest) {
  try {
    const { audioUrl } = await request.json();

    if (!audioUrl) {
      return NextResponse.json(
        { error: "audioUrl is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    console.log("🎙️ Starting batch transcription for:", audioUrl);

    // Fetch audio file from URL
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
    }

    const audioBlob = await audioResponse.blob();
    console.log(`📦 Audio file size: ${audioBlob.size} bytes`);

    // Create form data for ElevenLabs API
    // According to docs: https://elevenlabs.io/docs/api-reference/speech-to-text/convert
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("model_id", "scribe_v2");
    formData.append("diarize", "true"); // Enable speaker diarization
    // Note: language_code is optional - omitting it enables auto-detection

    // Enhanced Scribe V2 features
    formData.append("punctuation", "enhanced"); // Better text formatting
    formData.append("profanity_filter", "true"); // Mask profanity for compliance
    formData.append("include_sentiment", "true"); // Sentiment analysis
    formData.append("paragraphs", "true"); // Paragraph detection

    // Custom vocabulary for compliance terms
    const customVocabulary = [
      "GDPR", "HIPAA", "compliance", "персональные данные",
      "конфиденциальность", "согласие", "обработка данных",
      "субъект данных", "контроллер", "процессор"
    ];
    formData.append("vocabulary", JSON.stringify(customVocabulary));

    // Call ElevenLabs Batch API
    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ ElevenLabs API error:", errorText);
      return NextResponse.json(
        { error: `ElevenLabs API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log("✅ Batch transcription completed");
    console.log(`📊 Transcript: ${result.transcript?.length || 0} chars`);
    console.log(`📊 Segments: ${result.segments?.length || 0}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Batch transcription error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
