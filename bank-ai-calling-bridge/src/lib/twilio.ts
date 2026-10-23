import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;


export async function initiateCall(customerPhone: string, callId: string): Promise<string> {
    if (!client) {
        throw new Error('Twilio client not initialized. Check TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN.');
    }

    const twimlUrl = `${backendUrl}/api/twiml?callId=${encodeURIComponent(callId)}`;

    console.log(`[Twilio] Initiating call to ${customerPhone} for callId=${callId}`);

   const call = await client.calls.create({
        to: customerPhone,
        from: twilioPhoneNumber,
        url: twimlUrl,
        method: 'POST',
        statusCallback: `${backendUrl}/api/call-status?callId=${encodeURIComponent(callId)}`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        record: true,
        recordingStatusCallback: `${backendUrl}/api/recording-status?callId=${encodeURIComponent(callId)}`,
        recordingStatusCallbackEvent: ['completed'],
        recordingStatusCallbackMethod: 'POST',
    });

    console.log(`[Twilio] Call initiated: ${call.sid}`);
    return call.sid;
}

export function generateTwiML(streamUrl: string, callId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="callId" value="${escapeXml(callId)}" />
    </Stream>
  </Connect>
</Response>`;
}

export function getTwilioClient() {
    if (!client) {
        throw new Error('Twilio client not initialized.');
    }
    return client;
}

export function validateTwilioWebhookRequest(
    signature: string | undefined,
    url: string,
    params: Record<string, string>
): boolean {
    if (!authToken) return false;
    // Allow local development bypass only if specifically configured
    if (process.env.SKIP_TWILIO_VALIDATION === 'true' && process.env.NODE_ENV !== 'production') {
        return true;
    }
    if (!signature) return false;
    return twilio.validateRequest(authToken, signature, url, params);
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}