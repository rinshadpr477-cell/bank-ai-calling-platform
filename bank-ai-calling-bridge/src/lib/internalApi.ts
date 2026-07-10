

const MAIN_APP_URL = process.env.MAIN_APP_URL || 'http://localhost:3000';
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || '';

async function internalFetch<T>(path: string, body?: unknown, method: 'GET' | 'POST' = 'POST'): Promise<T> {
    if (!INTERNAL_SECRET) {
        throw new Error('INTERNAL_API_SECRET is not set in the bridge server .env');
    }

    const res = await fetch(`${MAIN_APP_URL}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': INTERNAL_SECRET,
        },
        body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Internal API call to ${path} failed (${res.status}): ${text}`);
    }

    return res.json() as Promise<T>;
}

export interface CallDetails {
    call: { id: string; status: string };
    customer: { id: string; name: string; phoneNumber: string; language: string };
    campaign: { id: string; name: string; aiPrompt: string; voice: string };
}

/** Fetches full call/customer/campaign context — called when the audio stream connects. */
export async function getCallDetails(callId: string): Promise<CallDetails> {
    return internalFetch<CallDetails>(`/api/internal/calls/${callId}`, undefined, 'GET');
}

export interface NextCallResult {
    done?: true;
    call?: { id: string };
    customer?: { id: string; name: string; phoneNumber: string; language: string };
    campaign?: { name: string; aiPrompt: string; voice: string };
}

/** Fetches the next PENDING customer in a campaign and atomically creates a Call row for them. */
export async function getNextCallForCampaign(campaignId: string): Promise<NextCallResult> {
    return internalFetch<NextCallResult>(`/api/internal/campaigns/${campaignId}/next-call`);
}

export type CallStatus = 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER';

export async function updateCallStatus(
    callId: string,
    status: CallStatus,
    twilioCallSid?: string
): Promise<void> {
    await internalFetch(`/api/internal/calls/${callId}/status`, { status, twilioCallSid });
}

export async function appendTranscriptTurn(
    callId: string,
    speaker: 'AI' | 'CUSTOMER',
    text: string
): Promise<void> {
    await internalFetch(`/api/internal/calls/${callId}/transcript-turn`, { speaker, text });
}

export interface CallSummaryInput {
    summaryText: string;
    sentiment?: string;
    interested?: boolean;
    loanAmount?: string;
    callbackRequired?: boolean;
}

export async function saveCallSummary(callId: string, summary: CallSummaryInput): Promise<void> {
    await internalFetch(`/api/internal/calls/${callId}/summary`, summary);
}