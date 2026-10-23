import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface AudioSummaryResult {
    summaryText: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    interested: boolean;
    loanAmount?: string;
    callbackRequired: boolean;
    callOutcome?: string;
    keyObjection?: string;
    nextAction?: string;
    followUpDate?: string;
    priority?: string;
}

const VALID_OUTCOMES = [
    'INTERESTED', 'FOLLOW_UP_REQUIRED', 'CALL_BACK_REQUESTED', 'NOT_INTERESTED',
    'PRICE_OBJECTION', 'NEEDS_DISCUSSION', 'DECISION_PENDING', 'MEETING_REQUIRED',
    'DEMO_REQUIRED', 'CONVERTED', 'NO_RESPONSE', 'WRONG_NUMBER', 'LOST',
];
const VALID_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW', 'NONE'];


export async function summarizeFromRecording(
    recordingUrl: string,
    campaignPrompt: string,
    customerName: string,
): Promise<AudioSummaryResult | null> {
    try {
        const parsedUrl = new URL(recordingUrl);
        if (parsedUrl.hostname !== 'api.twilio.com') {
            console.error(`[AudioSummary] Security error: recordingUrl hostname '${parsedUrl.hostname}' is not api.twilio.com`);
            return null;
        }

        const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
        const authToken = process.env.TWILIO_AUTH_TOKEN || '';
        const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        const audioResponse = await fetch(recordingUrl, {
            headers: { Authorization: `Basic ${credentials}` },
        });
        if (!audioResponse.ok) {
            console.error(`[AudioSummary] Failed to fetch recording: ${audioResponse.status}`);
            return null;
        }
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        const audioBase64 = audioBuffer.toString('base64');

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are analyzing a recorded bank outbound sales call between an AI agent and a customer named ${customerName}.

The campaign brief the AI agent was following:
${campaignPrompt}

Listen to the attached audio recording and produce a structured summary as a single, valid JSON object with exactly these fields:
{
  "summaryText": "2-4 plain-English sentences describing what was discussed and the outcome",
  "sentiment": "positive" | "neutral" | "negative",
  "interested": true or false (only true if the customer clearly expressed genuine interest, be strict),
  "loanAmount": "specific amount if mentioned, e.g. Rs. 5,00,000, otherwise omit this field",
  "callbackRequired": true or false,
  "callOutcome": one of ${VALID_OUTCOMES.join(', ')},
  "keyObjection": "the main hesitation the customer raised, if any, otherwise omit",
  "nextAction": "a short, concrete next step for the sales team, based only on what was actually said",
  "followUpDate": "ONLY include if the customer stated a specific day/time, never invent one",
  "priority": one of ${VALID_PRIORITIES.join(', ')}
}

Respond with ONLY the JSON object, no other text.`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { mimeType: 'audio/mpeg', data: audioBase64 } },
        ]);

        const responseText = result.response.text().trim();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[AudioSummary] No JSON found in model response');
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            summaryText: parsed.summaryText || 'Summary generated from recording, but no details were extracted.',
            sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
            interested: Boolean(parsed.interested),
            loanAmount: parsed.loanAmount || undefined,
            callbackRequired: Boolean(parsed.callbackRequired),
            callOutcome: VALID_OUTCOMES.includes(parsed.callOutcome) ? parsed.callOutcome : undefined,
            keyObjection: parsed.keyObjection || undefined,
            nextAction: parsed.nextAction || undefined,
            followUpDate: parsed.followUpDate || undefined,
            priority: VALID_PRIORITIES.includes(parsed.priority) ? parsed.priority : undefined,
        };
    } catch (err) {
        console.error('[AudioSummary] Failed to summarize recording:', err);
        return null;
    }
}