import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveCallSummary } from './internalApi';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');

interface TranscriptEntry {
    role: 'CUSTOMER' | 'AI';
    text: string;
}

export async function summarizeCall(
    callId: string,
    campaignPrompt: string,
    transcript: TranscriptEntry[],
    callDurationSeconds?: number
): Promise<void> {
    try {
        console.log(`[Summarization] Starting summarization for call ${callId} (duration: ${callDurationSeconds}s)`);

        if (!transcript || transcript.length === 0) {
            console.warn(`[Summarization] No transcript for call ${callId} — skipping.`);
            return;
        }

        const transcriptText = transcript.map((t) => `${t.role}: ${t.text}`).join('\n');
        const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

        const prompt = `
You are analyzing a bank's outbound AI sales/service call. Read the campaign brief and the transcript, then produce a structured summary.

## Campaign Brief
${campaignPrompt}

## Call Duration
${callDurationSeconds ? `${Math.floor(callDurationSeconds / 60)}m ${Math.floor(callDurationSeconds % 60)}s` : 'Unknown'}

## Transcript
${transcriptText}

## Instructions
1. Write a concise 2-4 sentence summary of what happened on the call.
2. Determine the customer's sentiment: "positive", "neutral", or "negative".
3. Determine if the customer expressed genuine interest in the offering (true/false). Be strict — only true if they clearly said so.
4. If a specific loan/product amount was mentioned, extract it as a string (e.g. "Rs. 5,00,000"). Otherwise null.
5. Determine if the customer asked for or agreed to a callback (true/false).

Return ONLY valid JSON, no markdown code fences, in this exact shape:
{
  "summary": "...",
  "sentiment": "positive" | "neutral" | "negative",
  "interested": true | false,
  "loanAmount": "..." | null,
  "callbackRequired": true | false
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        if (text.startsWith('```json')) {
            text = text.replace(/```json\n?/, '').replace(/\n?```/, '');
        } else if (text.startsWith('```')) {
            text = text.replace(/```\n?/, '').replace(/\n?```/, '');
        }

        const parsed = JSON.parse(text);

        await saveCallSummary(callId, {
            summaryText: parsed.summary,
            sentiment: parsed.sentiment,
            interested: parsed.interested,
            loanAmount: parsed.loanAmount ?? undefined,
            callbackRequired: parsed.callbackRequired,
        });

        console.log(`[Summarization] Successfully summarized call ${callId}`);
    } catch (error) {
        console.error(`[Summarization] Error summarizing call ${callId}:`, error);
        throw error;
    }
}