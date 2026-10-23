import 'dotenv/config';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { parse as parseUrl } from 'url';
import { connectToGemini, sendAudioToGemini, closeGemini, EndCallArgs } from './lib/geminiLive';
import { getCallDetails, updateCallStatus, appendTranscriptTurn, saveCallSummary, saveRecordingUrl } from './lib/internalApi';
import { summarizeFromRecording } from './lib/audioSummarization';
import { summarizeCall } from './lib/summarization';
import { generateTwiML, getTwilioClient, validateTwilioWebhookRequest } from './lib/twilio';
import { campaignQueue } from './lib/campaignQueue';

const PORT = parseInt(process.env.PORT || '8080', 10);
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

const requiredEnvVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'GOOGLE_GENAI_API_KEY', 'BACKEND_URL', 'MAIN_APP_URL', 'INTERNAL_API_SECRET'];

const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error(`[Server] CRITICAL: Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

function personalizePrompt(template: string, customerNotes: string | null): string {
    const data = customerNotes && customerNotes.trim().length > 0
        ? customerNotes
        : "No additional customer data was provided for this call.";
    return template.replace(/\{\{customer_data\}\}/g, data);
}

const server = createServer(async (req, res) => {
    const parsedUrl = parseUrl(req.url || '', true);
    const path = parsedUrl.pathname;

    const sendJson = (data: unknown, status = 200) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    if (path === '/health' || path === '/api/health') {
        sendJson({
            status: 'healthy',
            service: 'bank-ai-calling-bridge',
            uptimeSeconds: Math.round(process.uptime()),
            memoryUsage: process.memoryUsage(),
            timestamp: Date.now(),
        });
        return;
    }

    if (path === '/api/twiml' && req.method === 'POST') {
        const callId = parsedUrl.query.callId as string;
        console.log(`[Twilio] /api/twiml hit — callId=${callId}`);
        if (!callId) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing callId');
            return;
        }

        const wsProtocol = BACKEND_URL.startsWith('https') ? 'wss' : 'ws';
        const wsHost = BACKEND_URL.replace(/^https?:\/\//, '');
        const streamUrl = `${wsProtocol}://${wsHost}/media-stream`;

        const twiml = generateTwiML(streamUrl, callId);
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml);
        return;
    }

    if (path === '/api/call-status' && req.method === 'POST') {
        const callId = parsedUrl.query.callId as string | undefined;
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', async () => {
            const params = new URLSearchParams(body);
            const signature = req.headers['x-twilio-signature'] as string | undefined;
            const fullUrl = `${BACKEND_URL}${req.url}`;
            const paramsObj: Record<string, string> = {};
            params.forEach((v, k) => { paramsObj[k] = v; });

            if (!validateTwilioWebhookRequest(signature, fullUrl, paramsObj)) {
                console.warn(`[Twilio Security] Rejected unverified call-status webhook for callId=${callId}`);
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.end('Forbidden: Invalid Twilio signature');
                return;
            }

            const callStatus = params.get('CallStatus');
            const callSid = params.get('CallSid');
            console.log(`[CallStatus] callId=${callId} callSid=${callSid} status=${callStatus}`);
            res.writeHead(200);
            res.end();
            if (!callId) return;
            const NEVER_CONNECTED = ['no-answer', 'busy', 'failed', 'canceled'];
            if (!callStatus || !NEVER_CONNECTED.includes(callStatus)) return;
            try {
                const mappedStatus = callStatus === 'failed' ? 'FAILED' : 'NO_ANSWER';
                await updateCallStatus(callId, mappedStatus);
                const details = await getCallDetails(callId);
                console.log(`[CallStatus] Call ${callId} never connected (${callStatus}) — queuing next attempt for campaign ${details.campaign.id}`);
                await campaignQueue.add(
                    'trigger-campaign',
                    { campaignId: details.campaign.id },
                    { delay: 2000 }
                );
            } catch (err) {
                console.error(`[CallStatus] Failed to process no-answer/failed outcome for ${callId}:`, err);
            }
        });
        return;
    }

    if (path === '/api/recording-status' && req.method === 'POST') {
        const callId = parsedUrl.query.callId as string | undefined;
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', async () => {
            const params = new URLSearchParams(body);
            const signature = req.headers['x-twilio-signature'] as string | undefined;
            const fullUrl = `${BACKEND_URL}${req.url}`;
            const paramsObj: Record<string, string> = {};
            params.forEach((v, k) => { paramsObj[k] = v; });

            if (!validateTwilioWebhookRequest(signature, fullUrl, paramsObj)) {
                console.warn(`[Twilio Security] Rejected unverified recording-status webhook for callId=${callId}`);
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.end('Forbidden: Invalid Twilio signature');
                return;
            }

            res.writeHead(200);
            res.end();
            if (!callId) return;
            const recordingUrl = params.get('RecordingUrl');
            const recordingStatus = params.get('RecordingStatus');
            console.log(`[Recording] callId=${callId} status=${recordingStatus} url=${recordingUrl}`);
            if (recordingStatus === 'completed' && recordingUrl) {
                const fullRecordingUrl = `${recordingUrl}.mp3`;
                try {
                    await saveRecordingUrl(callId, fullRecordingUrl);
                    console.log(`[Recording] Saved recording URL for call ${callId}`);
                } catch (err) {
                    console.error(`[Recording] Failed to save recording URL for ${callId}:`, err);
                }
                try {
                    const details = await getCallDetails(callId);
                    const needsSummary = !details.summary?.sentiment || details.summary.sentiment === 'unknown';

                    if (needsSummary) {
                        console.log(`[AudioSummary] Generating summary from recording for call ${callId}...`);
                        const summary = await summarizeFromRecording(
                            fullRecordingUrl,
                            details.campaign.aiPrompt,
                            details.customer.name,
                        );

                        if (summary) {
                            await saveCallSummary(callId, summary);
                            console.log(`[AudioSummary] Saved recording-based summary for call ${callId}`);
                        } else {
                            console.warn(`[AudioSummary] Could not generate summary from recording for call ${callId}`);
                        }
                    }
                } catch (err) {
                    console.error(`[AudioSummary] Error during post-call summarization for ${callId}:`, err);
                }
            }
        });
        return;
    }

    if (path === '/api/trigger-campaign' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const secret = req.headers['x-internal-secret'];
                if (secret !== process.env.INTERNAL_API_SECRET) {
                    sendJson({ error: 'Unauthorized' }, 401);
                    return;
                }
                const { campaignId } = JSON.parse(body);
                if (!campaignId) {
                    sendJson({ error: 'campaignId is required' }, 400);
                    return;
                }
                await campaignQueue.add('trigger-campaign', { campaignId });
                sendJson({ triggered: true });
            } catch (err) {
                sendJson({ error: String(err) }, 500);
            }
        });
        return;
    }
    res.writeHead(404);
    res.end('Not found');
});

interface SessionState {
    streamSid: string;
    callSid: string;
    callId: string;
    customerName: string;
    campaignName: string;
    campaignId: string;
    campaignPrompt: string;
    language: string;
    geminiWs: WebSocket | null;
    transcript: Array<{ role: 'CUSTOMER' | 'AI'; text: string }>;
    startTime: number;
    isEnded: boolean;
    endCallSummary: EndCallArgs | null;
    resumptionHandle: string | null;
}

const sessions: Map<string, SessionState> = new Map();

const cleanupSession = (session: SessionState) => {
    if (session.geminiWs) closeGemini(session.geminiWs);
    sessions.delete(session.streamSid);
};

const endCall = async (session: SessionState, finalStatus: 'COMPLETED' | 'FAILED') => {
    if (session.isEnded) return;
    session.isEnded = true;

    const durationSeconds = (Date.now() - session.startTime) / 1000;

    try {
        await updateCallStatus(session.callId, finalStatus);
    } catch (err) {
        console.error('[Bridge] Failed to update call status:', err);
    }

    try {
        if (session.endCallSummary) {
            await saveCallSummary(session.callId, {
                summaryText: session.endCallSummary.summary,
                sentiment: session.endCallSummary.sentiment,
                interested: session.endCallSummary.interested,
                loanAmount: session.endCallSummary.loanAmount,
                callbackRequired: session.endCallSummary.callbackRequired,
                callOutcome: session.endCallSummary.callOutcome,
                keyObjection: session.endCallSummary.keyObjection,
                nextAction: session.endCallSummary.nextAction,
                followUpDate: session.endCallSummary.followUpDate,
                priority: session.endCallSummary.priority,
            });
            console.log(`[Bridge] Saved AI-reported summary for call ${session.callId}`);
        }
        else if (session.transcript.length > 0) {
            await summarizeCall(session.callId, session.campaignPrompt, session.transcript, durationSeconds);
        } else {
            console.warn(`[Bridge] No summary data for call ${session.callId} — saving fallback record.`);
            await saveCallSummary(session.callId, {
                summaryText: `Call ran for ${Math.round(durationSeconds)}s but ended before a summary could be recorded (connection interrupted mid-call). No outcome data available — the customer may have expressed real interest or requests that were not captured. Consider a manual follow-up call.`,
                sentiment: "unknown",
            });
        }
    } catch (err) {
        console.error('[Bridge] Failed to save call summary:', err);
    }

    cleanupSession(session);

    await campaignQueue.add(
        'trigger-campaign',
        { campaignId: session.campaignId },
        { delay: 3000 }
    );
};

const MAX_RECONNECT_ATTEMPTS = 2;

async function connectGeminiWithRetry(
    session: SessionState,
    twilioWs: WebSocket,
    callSid: string,
    attempt: number = 0,
): Promise<WebSocket> {
    return connectToGemini(
        session.campaignPrompt,
        session.campaignName,
        session.customerName,
        session.language,
        (audio) => {
            twilioWs.send(JSON.stringify({ event: 'media', streamSid: session.streamSid, media: { payload: audio } }));
        },
        (role, text) => {
            session.transcript.push({ role, text });
            appendTranscriptTurn(session.callId, role, text).catch((err) =>
                console.error('[Bridge] Failed to append transcript turn:', err)
            );
        },
        (tool, args) => {
            if (tool === 'end_call') {
                console.log('[Bridge] end_call tool invoked with args:', args);
                session.endCallSummary = args;
                getTwilioClient().calls(callSid).update({ status: 'completed' }).catch(() => { });
            }
        },
        async () => {
            if (session.isEnded) {
                return;
            }

            if (session.endCallSummary) {
                console.log('[Gemini] Connection closed after end_call — ending call normally');
                getTwilioClient().calls(callSid).update({ status: 'completed' }).catch(() => { });
                endCall(session, 'COMPLETED').catch(() => { });
                return;
            }
            if (attempt < MAX_RECONNECT_ATTEMPTS && session.resumptionHandle) {
                console.log(`[Gemini] Unexpected disconnect — resuming session (attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS})`);
                try {
                    const newWs = await connectGeminiWithRetry(session, twilioWs, callSid, attempt + 1);
                    session.geminiWs = newWs;
                } catch (err) {
                    console.error('[Gemini] Resumption attempt failed:', err);
                    getTwilioClient().calls(callSid).update({ status: 'completed' }).catch(() => { });
                    endCall(session, 'COMPLETED').catch(() => { });
                }
                return;
            }

            console.log('[Gemini] Connection closed — ending call');
            getTwilioClient().calls(callSid).update({ status: 'completed' }).catch(() => { });
            endCall(session, 'COMPLETED').catch(() => { });
        },
        session.resumptionHandle,
        (handle) => {
            session.resumptionHandle = handle;
        },
    );
}

const wss = new WebSocketServer({ server, path: '/media-stream' });

wss.on('connection', (twilioWs: WebSocket) => {
    let currentSession: SessionState | null = null;

    twilioWs.on('close', () => {
        if (currentSession) endCall(currentSession, 'COMPLETED').catch(() => { });
    });

    twilioWs.on('error', (err) => {
        console.error('[Twilio WS] Error:', err);
        if (currentSession) endCall(currentSession, 'FAILED').catch(() => { });
    });

    twilioWs.on('message', async (data: Buffer) => {
        try {
            const message = JSON.parse(data.toString());

            if (message.event === 'start') {
                const { streamSid, callSid, customParameters } = message.start;
                const callId = customParameters?.callId;

                console.log(`[Twilio] STREAM START streamSid=${streamSid} callSid=${callSid} callId=${callId}`);

                if (!callId) {
                    console.error('[Twilio] No callId in stream parameters — cannot proceed.');
                    twilioWs.close();
                    return;
                }

                const details = await getCallDetails(callId);

                const newSession: SessionState = {
                    streamSid,
                    callSid,
                    callId,
                    customerName: details.customer.name,
                    campaignName: details.campaign.name,
                    campaignId: details.campaign.id,
                    campaignPrompt: personalizePrompt(details.campaign.aiPrompt, details.customer.notes),
                    language: details.customer.language || 'en',
                    geminiWs: null,
                    transcript: [],
                    startTime: Date.now(),
                    isEnded: false,
                    endCallSummary: null,
                    resumptionHandle: null,
                };
                currentSession = newSession;
                sessions.set(streamSid, newSession);

                await updateCallStatus(callId, 'IN_PROGRESS', callSid);

                const geminiWs = await connectGeminiWithRetry(newSession, twilioWs, callSid);
                currentSession.geminiWs = geminiWs;

            } else if (message.event === 'media' && currentSession?.geminiWs) {
                sendAudioToGemini(currentSession.geminiWs, message.media.payload);

            } else if (message.event === 'stop' && currentSession) {
                console.log('[Twilio] STREAM STOP');
                await endCall(currentSession, 'COMPLETED');
            }
        } catch (err) {
            console.error('[Bridge] Error processing Twilio message:', err);
        }
    });
});

server.listen(PORT, () => {
    console.log(` Bank AI Calling bridge server running on port ${PORT}`);
});