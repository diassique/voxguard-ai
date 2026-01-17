/**
 * AudioWorklet Processor for ElevenLabs Scribe
 * Captures audio from microphone and converts to PCM16 format
 * Runs in dedicated audio rendering thread for best performance
 */

class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096; // Process in chunks
    this.buffer = [];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    // Only process if we have input
    if (!input || !input[0]) {
      return true;
    }

    const inputChannel = input[0]; // Mono audio (first channel)

    // Convert Float32 samples to Int16 (PCM16)
    const pcm16 = new Int16Array(inputChannel.length);
    for (let i = 0; i < inputChannel.length; i++) {
      // Clamp to [-1, 1] and convert to 16-bit integer
      const s = Math.max(-1, Math.min(1, inputChannel[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Accumulate samples in buffer
    this.buffer.push(pcm16);

    // When buffer reaches target size, send to main thread
    const totalSamples = this.buffer.reduce((sum, arr) => sum + arr.length, 0);
    if (totalSamples >= this.bufferSize) {
      // Concatenate all buffered chunks
      const concatenated = new Int16Array(totalSamples);
      let offset = 0;
      for (const chunk of this.buffer) {
        concatenated.set(chunk, offset);
        offset += chunk.length;
      }

      // Send to main thread
      this.port.postMessage({
        type: 'audio',
        data: concatenated.buffer,
      });

      // Clear buffer
      this.buffer = [];
    }

    // Keep processor alive
    return true;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
