import { WebSocket } from 'ws';
import {
    mulawToPcmTimed,
    resamplePcmTimed,
    pcmToMulawTimed,
    calculateRms,
} from './audioUtils';



const GEMINI_MODEL = 'models/gemini-2.5-flash-native-audio-latest';
const AGENT_NAME = process.env.AI_AGENT_NAME || 'Priya';

export const LATENCY_OPT_CONFIG = {
    AUDIO_BATCH_MS: parseInt(process.env.AUDIO_BATCH_MS || '10', 10),
    ECHO_DRAIN_MS: parseInt(process.env.ECHO_DRAIN_MS || '250', 10),
    VAD_SILENCE_DURATION_MS: parseInt(process.env.VAD_SILENCE_DURATION_MS || '350', 10),
    VAD_PREFIX_PADDING_MS: parseInt(process.env.VAD_PREFIX_PADDING_MS || '100', 10),
    LOCAL_VAD_CONSECUTIVE_PACKETS: parseInt(process.env.LOCAL_VAD_CONSECUTIVE_PACKETS || '2', 10),
    USE_COMPACT_PROMPT: process.env.USE_COMPACT_PROMPT !== 'false',
};

const AUDIO_BATCH_MS = LATENCY_OPT_CONFIG.AUDIO_BATCH_MS;
const ECHO_DRAIN_MS = LATENCY_OPT_CONFIG.ECHO_DRAIN_MS;
const PACKET_GAP_WARN_MS = 60;

let eventLoopLag = 0;
function monitorEventLoop() {
    const start = Date.now();
    setImmediate(() => {
        eventLoopLag = Date.now() - start;
        setTimeout(monitorEventLoop, 100);
    });
}
monitorEventLoop();

interface TurnTimings {
    candidateSpeechStartEstimateAt: number | null;
    firstCandidatePacketAt: number | null;
    firstForwardedPacketAt: number | null;
    geminiSpeechStartAt: number | null;
    firstTranscriptionAt: number | null;
    geminiEosAt: number | null;
    firstModelTokenAt: number | null;
    firstModelAudioAt: number | null;
    lastModelAudioAt: number | null;
    turnCompleteAt: number | null;
    packetsReceived: number;
    packetsDroppedActive: number;
    packetsDroppedEcho: number;
    packetsForwarded: number;
    echoGateDurationMs: number;
    peakRms: number;
    sumRms: number;
    rmsCount: number;
    audioChunks: number;
    textParts: number;
    candidateLastPacketAt: number;
}

function nowMs(): number {
    return Number(process.hrtime.bigint()) / 1_000_000;
}

function logWithTime(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function warnWithTime(message: string): void {
    console.warn(`[${new Date().toISOString()}] ${message}`);
}

function printTimingSummary(t: TurnTimings): void {
    const base = t.firstCandidatePacketAt || t.candidateSpeechStartEstimateAt || t.firstForwardedPacketAt || t.candidateLastPacketAt;
    const fmt = (n: number | null) => n == null ? '   N/A' : `${(n - base).toFixed(1).padStart(7)} ms`;

    console.log('');
    console.log('==================================================');
    console.log('      VOICE PIPELINE TIMINGS (this turn)');
    console.log('==================================================');
    console.log(`First Twilio Packet     : ${fmt(t.firstCandidatePacketAt)} (baseline)`);
    console.log(`First Forwarded Packet  : ${fmt(t.firstForwardedPacketAt)}`);
    console.log(`Gemini Speech Detected  : ${fmt(t.geminiSpeechStartAt)}`);
    console.log(`Input Transcr. Received : ${fmt(t.firstTranscriptionAt)}`);
    console.log(`First Model Audio Chunk : ${fmt(t.firstModelAudioAt)}`);
    console.log(`Turn Complete Received  : ${fmt(t.turnCompleteAt)}`);
    console.log(`──────────────────────────────────────────────────`);
    console.log(`Packets Received        : ${t.packetsReceived}`);
    console.log(`Packets Dropped Active  : ${t.packetsDroppedActive}`);
    console.log(`Packets Dropped Echo    : ${t.packetsDroppedEcho}`);
    console.log(`Packets Forwarded       : ${t.packetsForwarded}`);
    console.log(`Average RMS             : ${t.rmsCount > 0 ? (t.sumRms / t.rmsCount).toFixed(1) : '0.0'}`);
    console.log(`Current Event Loop Lag  : ${eventLoopLag} ms`);
    console.log('==================================================');
    console.log('');
}

interface SessionGate {
    isAiSpeaking: boolean;
    echoGateUntil: number;
    lastAudioSentToTwilioAt: number;
    audioBuffer: Buffer[];
    lastFlushTime: number;
    lastTwilioPacketAt: number;
    packetCount: number;
    droppedActiveCount: number;
    droppedEchoCount: number;
    timings: TurnTimings;
    wasActiveDropping: boolean;
    wasEchoDropping: boolean;
    playbackFinishedAt: number;
    wasClosedLogged?: boolean;
    flushCount?: number;
    consecutiveSpeechPackets?: number;
}

const sessionGates = new Map<WebSocket, SessionGate>();

function makeTimings(): TurnTimings {
    return {
        candidateSpeechStartEstimateAt: null,
        firstCandidatePacketAt: null,
        firstForwardedPacketAt: null,
        geminiSpeechStartAt: null,
        firstTranscriptionAt: null,
        geminiEosAt: null,
        firstModelTokenAt: null,
        firstModelAudioAt: null,
        turnCompleteAt: null,
        lastModelAudioAt: null,
        packetsReceived: 0,
        packetsDroppedActive: 0,
        packetsDroppedEcho: 0,
        packetsForwarded: 0,
        echoGateDurationMs: ECHO_DRAIN_MS,
        peakRms: 0,
        sumRms: 0,
        rmsCount: 0,
        audioChunks: 0,
        textParts: 0,
        candidateLastPacketAt: nowMs(),
    };
}

function getGeminiWsUrl(): string {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_GENAI_API_KEY is not set');
    return (
        `wss://generativelanguage.googleapis.com/ws/` +
        `google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent` +
        `?key=${apiKey}`
    );
}

/**
 * Builds the system prompt for a bank outbound call.
 * campaignPrompt is admin-authored per campaign (Campaign Configuration
 * module) — we wrap it with call-mechanics guidance that stays constant.
 */
function createSystemPrompt(
    campaignPrompt: string,
    campaignName: string,
    customerName: string,
    language: string,
): string {
    return `You are ${AGENT_NAME}, calling on behalf of a bank. You are speaking with ${customerName}. Conduct the entire call in "${language}". Translate all instructions dynamically.

Campaign brief:
${campaignPrompt}

Guidelines:
1. Stay in character: Professional, warm, and respectful of the customer's time.
2. Active Listening: Acknowledge what the customer says before responding. Ask only one question per turn.
3. Keep it natural: Output only what is spoken on a phone call. No meta-talk, no stage directions.
4. Respect refusals: If the customer isn't interested or asks to end the call, thank them politely and end the call immediately — do not persist.
5. Conclusion: When the call reaches a natural end, speak this EXACT phrase in "${language}": "Thank you for your time today. Have a great day. Goodbye." Then immediately call the end_call tool.

Reporting on end_call: You must fill in every field accurately based on the actual conversation that just happened, since this is the ONLY record your team will have of this call:
- summary: 2-4 plain-English sentences describing what was discussed and the outcome.
- sentiment: "positive", "neutral", or "negative" — the customer's overall tone.
- interested: true only if the customer clearly expressed genuine interest. Be strict — do not guess.
- loanAmount: a specific amount if one was mentioned (e.g. "Rs. 5,00,000"), otherwise omit this field entirely.
- callbackRequired: true if the customer asked for or agreed to a callback.

Greeting: Introduce yourself and the bank, briefly explain why you're calling, per the campaign brief above.`;
}

export interface EndCallArgs {
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    interested: boolean;
    loanAmount?: string;
    callbackRequired: boolean;
}

export async function connectToGemini(
    campaignPrompt: string,
    campaignName: string,
    customerName: string,
    language: string,
    onAudioReceived: (audioBase64: string) => void,
    onTranscriptionReceived: (role: 'CUSTOMER' | 'AI', text: string) => void,
    onToolCall: (toolName: string, args: EndCallArgs) => void,
    onClose: () => void,
): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(getGeminiWsUrl(), { perMessageDeflate: false });
        let isSetupComplete = false;
        const connectT = nowMs();

        ws.on('open', () => {
            logWithTime(`[Gemini] ✅ WebSocket OPEN (+${(nowMs() - connectT).toFixed(0)}ms)`);

            sessionGates.set(ws, {
                isAiSpeaking: false,
                echoGateUntil: 0,
                lastAudioSentToTwilioAt: 0,
                audioBuffer: [],
                lastFlushTime: Date.now(),
                lastTwilioPacketAt: Date.now(),
                packetCount: 0,
                droppedActiveCount: 0,
                droppedEchoCount: 0,
                timings: makeTimings(),
                wasActiveDropping: false,
                wasEchoDropping: false,
                playbackFinishedAt: 0,
                wasClosedLogged: false,
                flushCount: 0,
            });

            const setupMessage = {
                setup: {
                    model: GEMINI_MODEL,
                    generation_config: {
                        response_modalities: ['AUDIO'],
                        speech_config: {
                            voice_config: { prebuilt_voice_config: { voice_name: 'Aoede' } },
                        },
                    },
                    system_instruction: {
                        parts: [{ text: createSystemPrompt(campaignPrompt, campaignName, customerName, language) }],
                    },
                    tools: [{
                        function_declarations: [{
                            name: 'end_call',
                            description: 'Terminates the call. Call this IMMEDIATELY after saying the goodbye phrase, with an accurate structured report of the call outcome — this is the only record your team will have of what happened.',
                            parameters: {
                                type: 'OBJECT',
                                properties: {
                                    summary: { type: 'STRING', description: '2-4 plain-English sentences describing what was discussed and the outcome.' },
                                    sentiment: { type: 'STRING', description: 'Customer overall tone: "positive", "neutral", or "negative".' },
                                    interested: { type: 'BOOLEAN', description: 'True only if the customer clearly expressed genuine interest.' },
                                    loanAmount: { type: 'STRING', description: 'Specific amount mentioned, e.g. "Rs. 5,00,000". Omit if none was mentioned.' },
                                    callbackRequired: { type: 'BOOLEAN', description: 'True if the customer asked for or agreed to a callback.' },
                                },
                                required: ['summary', 'sentiment', 'interested', 'callbackRequired'],
                            },
                        }],
                    }],
                    input_audio_transcription: {},
                    output_audio_transcription: {},
                    realtime_input_config: {
                        automatic_activity_detection: {
                            disabled: false,
                            silence_duration_ms: LATENCY_OPT_CONFIG.VAD_SILENCE_DURATION_MS,
                            prefix_padding_ms: LATENCY_OPT_CONFIG.VAD_PREFIX_PADDING_MS,
                        },
                    },
                },
            };

            ws.send(JSON.stringify(setupMessage));
            console.log(`[Gemini] → SETUP sent`);
        });

        ws.on('message', (data: Buffer) => {
            const msgT = nowMs();
            const gate = sessionGates.get(ws);
            let response: any;

            try {
                response = JSON.parse(data.toString());
            } catch (err) {
                warnWithTime(`[Gemini] 🔴 PARSE ERROR: ${err}`);
                return;
            }

            const content = response.server_content ?? response.serverContent;
            const modelTurn = content?.model_turn ?? content?.modelTurn;
            const turnComplete = content?.turn_complete ?? content?.turnComplete;
            const transcription = content?.input_audio_transcription ?? content?.inputAudioTranscription;
            const outputTranscription = content?.output_audio_transcription ?? content?.outputAudioTranscription;
            const interrupted = content?.interrupted ?? response.interrupted;

            if ((response.setupComplete || response.setup_complete) && !isSetupComplete) {
                isSetupComplete = true;
                logWithTime(`[Gemini] ✅ SETUP_COMPLETE @${msgT.toFixed(1)}ms`);

                ws.send(JSON.stringify({
                    client_content: {
                        turns: [{ role: 'user', parts: [{ text: 'Hello, please start the call.' }] }],
                        turn_complete: true,
                    },
                }));
                resolve(ws);
                return;
            }

            if (!content) return;

            if (interrupted && gate) {
                logWithTime(`[Gemini] ⚠️ INTERRUPTION detected (customer barge-in)`);
                gate.isAiSpeaking = false;
                if (gate.timings.geminiSpeechStartAt === null) gate.timings.geminiSpeechStartAt = msgT;
                gate.playbackFinishedAt = 0;
                gate.echoGateUntil = 0;
            }

            if (modelTurn?.parts) {
                for (const part of modelTurn.parts) {
                    const inlineData = part.inline_data ?? part.inlineData;
                    if (inlineData?.mime_type?.startsWith('audio/') || inlineData?.mimeType?.startsWith('audio/')) {
                        const rawData = inlineData.data as string;
                        if (!rawData) continue;

                        const pcm24k = Buffer.from(rawData, 'base64');
                        const { result: pcm8k } = resamplePcmTimed(pcm24k, 24000, 8000);
                        const { result: mulaw8k } = pcmToMulawTimed(pcm8k);

                        if (gate) {
                            if (!gate.timings.firstModelAudioAt) gate.timings.firstModelAudioAt = msgT;
                            gate.timings.lastModelAudioAt = msgT;
                            gate.timings.audioChunks++;
                            gate.isAiSpeaking = true;
                            gate.lastAudioSentToTwilioAt = Date.now();
                            const chunkDurationMs = mulaw8k.length / 8;
                            gate.playbackFinishedAt = Math.max(gate.playbackFinishedAt, Date.now()) + chunkDurationMs;
                        }

                        onAudioReceived(mulaw8k.toString('base64'));
                    }

                    if (part.text) {
                        if (part.thought) continue;
                        if (gate && !gate.timings.firstModelTokenAt) gate.timings.firstModelTokenAt = msgT;
                        if (gate) gate.timings.textParts++;
                        logWithTime(`[Gemini] ← text (spoken): "${part.text}"`);
                        onTranscriptionReceived('AI', part.text);
                    }

                    const fn = part.function_call ?? part.functionCall;
                    if (fn) {
                        logWithTime(`[Gemini] ← function_call: "${fn.name}" args: ${JSON.stringify(fn.args ?? {})}`);
                        try {
                            if (fn.name === 'end_call') {
                                const rawArgs = fn.args ?? {};
                                const endCallArgs: EndCallArgs = {
                                    summary: rawArgs.summary || 'No summary provided by the model.',
                                    sentiment: ['positive', 'neutral', 'negative'].includes(rawArgs.sentiment)
                                        ? rawArgs.sentiment
                                        : 'neutral',
                                    interested: Boolean(rawArgs.interested),
                                    loanAmount: rawArgs.loanAmount || undefined,
                                    callbackRequired: Boolean(rawArgs.callbackRequired),
                                };
                                onToolCall('end_call', endCallArgs);
                            }
                        } catch (err) {
                            warnWithTime(`[Gemini] Error in onToolCall: ${err}`);
                        }
                        ws.send(JSON.stringify({
                            tool_response: { function_responses: [{ name: fn.name, id: fn.id, response: { result: 'ok', status: 'success' } }] },
                        }));
                    }
                }
            }

            if (turnComplete && gate) {
                gate.isAiSpeaking = false;
                gate.audioBuffer = [];
                gate.lastFlushTime = Date.now();
                if (gate.playbackFinishedAt > 0) {
                    gate.echoGateUntil = gate.playbackFinishedAt + ECHO_DRAIN_MS;
                    gate.playbackFinishedAt = 0;
                }
                gate.timings.turnCompleteAt = msgT;
                printTimingSummary(gate.timings);
                gate.timings = makeTimings();
                gate.timings.candidateLastPacketAt = msgT;
            }

            if (transcription?.text) {
                if (gate) {
                    if (gate.timings.geminiSpeechStartAt === null) gate.timings.geminiSpeechStartAt = msgT;
                    if (!gate.timings.firstTranscriptionAt) {
                        gate.timings.firstTranscriptionAt = msgT;
                        gate.timings.geminiEosAt = msgT;
                    }
                }
                logWithTime(`[Gemini] ← customer transcript: "${transcription.text}"`);
                onTranscriptionReceived('CUSTOMER', transcription.text);
            }

            if (outputTranscription?.text) {
                logWithTime(`[Gemini] ← AI transcript: "${outputTranscription.text}"`);
                onTranscriptionReceived('AI', outputTranscription.text);
            }
        });

        ws.on('close', (code: number, reason: Buffer) => {
            logWithTime(`[Gemini] 🔴 WebSocket CLOSED code=${code} reason="${reason.toString()}"`);
            sessionGates.delete(ws);
            onClose();
        });

        ws.on('error', (err) => {
            warnWithTime(`[Gemini] 🔴 WebSocket ERROR: ${err.message}`);
            reject(err);
        });
    });
}

const LOG_EVERY_N_PACKETS = 50;

export function sendAudioToGemini(ws: WebSocket, audioBase64: string): void {
    const gate = sessionGates.get(ws);
    const arrT = nowMs();

    if (ws.readyState !== WebSocket.OPEN) {
        if (gate && !gate.wasClosedLogged) {
            gate.wasClosedLogged = true;
            warnWithTime(`[Audio] 🔴 Gemini WS not OPEN. Dropping subsequent packets.`);
        }
        return;
    }

    if (!gate) {
        const { result: pcm8k } = resamplePcmTimed(
            mulawToPcmTimed(Buffer.from(audioBase64, 'base64')).result,
            8000, 16000,
        );
        _flush(ws, pcm8k);
        return;
    }

    gate.packetCount++;
    gate.timings.packetsReceived++;
    const gapMs = Date.now() - gate.lastTwilioPacketAt;
    gate.lastTwilioPacketAt = Date.now();

    const rawBuf = Buffer.from(audioBase64, 'base64');
    const { result: pcm8k } = mulawToPcmTimed(rawBuf);
    const { result: pcm16k } = resamplePcmTimed(pcm8k, 8000, 16000);

    const rms = calculateRms(pcm8k);
    gate.timings.peakRms = Math.max(gate.timings.peakRms, rms);
    gate.timings.sumRms += rms;
    gate.timings.rmsCount++;

    if (gate.timings.firstCandidatePacketAt === null) {
        gate.timings.firstCandidatePacketAt = arrT;
    }

    const localVadThreshold = LATENCY_OPT_CONFIG.LOCAL_VAD_CONSECUTIVE_PACKETS;
    if (rms > 300) {
        gate.consecutiveSpeechPackets = (gate.consecutiveSpeechPackets || 0) + 1;
        if (gate.consecutiveSpeechPackets >= localVadThreshold && gate.timings.candidateSpeechStartEstimateAt === null) {
            gate.timings.candidateSpeechStartEstimateAt = arrT - localVadThreshold * 20;
        }
    } else {
        gate.consecutiveSpeechPackets = 0;
    }

    if (gapMs > PACKET_GAP_WARN_MS) {
        warnWithTime(`[Audio] ⚠️ Twilio packet gap: ${gapMs}ms at packet #${gate.packetCount}`);
    }

    if (gate.isAiSpeaking) {
        gate.droppedActiveCount++;
        gate.timings.packetsDroppedActive++;
        return;
    }

    const nowT = Date.now();
    if (nowT < gate.echoGateUntil) {
        gate.droppedEchoCount++;
        gate.timings.packetsDroppedEcho++;
        return;
    }

    if (gate.timings.firstForwardedPacketAt === null) {
        gate.timings.firstForwardedPacketAt = arrT;
    }

    gate.timings.packetsForwarded++;
    gate.timings.candidateLastPacketAt = arrT;
    gate.audioBuffer.push(pcm16k);

    const now = Date.now();
    if (now - gate.lastFlushTime >= AUDIO_BATCH_MS) {
        const combined = Buffer.concat(gate.audioBuffer);
        gate.audioBuffer = [];
        gate.lastFlushTime = now;
        _flush(ws, combined);
    }
}

function _flush(ws: WebSocket, pcm16k: Buffer): void {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
        realtime_input: { media_chunks: [{ mime_type: 'audio/pcm;rate=16000', data: pcm16k.toString('base64') }] },
    }));
}

export function closeGemini(ws: WebSocket): void {
    const gate = sessionGates.get(ws);
    if (gate) {
        if (gate.audioBuffer.length) _flush(ws, Buffer.concat(gate.audioBuffer));
        logWithTime(`[Gemini] Session closed — packets=${gate.packetCount} droppedActive=${gate.droppedActiveCount} droppedEcho=${gate.droppedEchoCount}`);
    }
    sessionGates.delete(ws);
    if (ws.readyState === WebSocket.OPEN) ws.close();
}