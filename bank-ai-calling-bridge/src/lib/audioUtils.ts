

const { mulaw } = require('alawmulaw');


export function mulawToPcm(mulawBuffer: Buffer): Buffer {
    const input  = new Uint8Array(mulawBuffer.buffer, mulawBuffer.byteOffset, mulawBuffer.length);
    const output = mulaw.decode(input) as Int16Array;   // Int16Array, LE
    return Buffer.from(output.buffer, output.byteOffset, output.byteLength);
}

/** Encode 16-bit signed LE PCM → μ-law bytes (for sending back to Twilio). */
export function pcmToMulaw(pcmBuffer: Buffer): Buffer {
    const input  = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2);
    const output = mulaw.encode(input) as Uint8Array;
    return Buffer.from(output.buffer, output.byteOffset, output.byteLength);
}


export function resamplePcm(samplesBuffer: Buffer, fromRate: number, toRate: number): Buffer {
    if (fromRate === toRate) return samplesBuffer;

    const samples   = new Int16Array(samplesBuffer.buffer, samplesBuffer.byteOffset, samplesBuffer.length / 2);
    const ratio     = fromRate / toRate;                         // 0.5 for 8k→16k
    const outLength = Math.round(samples.length / ratio);
    const result    = new Int16Array(outLength);

    for (let i = 0; i < outLength; i++) {
        const srcIndex = i * ratio;
        const idx      = Math.floor(srcIndex);
        const frac     = srcIndex - idx;
        const next     = Math.min(idx + 1, samples.length - 1);
        result[i]      = Math.round(samples[idx] * (1 - frac) + samples[next] * frac);
    }

    return Buffer.from(result.buffer, result.byteOffset, result.byteLength);
}


export function mulawToPcmTimed(buf: Buffer): { result: Buffer; us: number } {
    const t0     = process.hrtime.bigint();
    const result = mulawToPcm(buf);
    return { result, us: Number(process.hrtime.bigint() - t0) / 1000 };
}

export function resamplePcmTimed(buf: Buffer, from: number, to: number): { result: Buffer; us: number } {
    const t0     = process.hrtime.bigint();
    const result = resamplePcm(buf, from, to);
    return { result, us: Number(process.hrtime.bigint() - t0) / 1000 };
}

export function pcmToMulawTimed(buf: Buffer): { result: Buffer; us: number } {
    const t0     = process.hrtime.bigint();
    const result = pcmToMulaw(buf);
    return { result, us: Number(process.hrtime.bigint() - t0) / 1000 };
}

/** Calculate the Root Mean Square (RMS) of a 16-bit LE PCM audio buffer. */
export function calculateRms(pcmBuffer: Buffer): number {
    if (pcmBuffer.length === 0) return 0;
    const samples = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2);
    if (samples.length === 0) return 0;
    let sumSquares = 0;
    for (let i = 0; i < samples.length; i++) {
        sumSquares += samples[i] * samples[i];
    }
    return Math.sqrt(sumSquares / samples.length);
}