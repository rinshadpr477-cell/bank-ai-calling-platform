const apiKey = process.env.GOOGLE_GENAI_API_KEY || "";

const VALID_OUTCOMES = [
    "INTERESTED", "FOLLOW_UP_REQUIRED", "CALL_BACK_REQUESTED", "NOT_INTERESTED",
    "PRICE_OBJECTION", "NEEDS_DISCUSSION", "DECISION_PENDING", "MEETING_REQUIRED",
    "DEMO_REQUIRED", "CONVERTED", "NO_RESPONSE", "WRONG_NUMBER", "LOST",
];
const VALID_PRIORITIES = ["HIGH", "MEDIUM", "LOW", "NONE"];

export interface ManualCallExtraction {
    summaryText: string;
    callOutcome: string;
    interested: boolean | null;
    keyObjection?: string;
    nextAction?: string;
    followUpDate?: string;
    priority: string;
}

export async function extractManualCallSummary(rawNotes: string): Promise<ManualCallExtraction | null> {
    try {
        const prompt = `You are extracting structured information from a salesperson's manual notes about a phone call they just made themselves (not an AI call). Do not rewrite or embellish — extract only what is actually stated.

Salesperson's notes:
"${rawNotes}"

Respond with ONLY a valid JSON object, no other text, with exactly these fields:
{
  "summaryText": "a concise 1-2 sentence summary of what the notes say",
  "callOutcome": one of ${VALID_OUTCOMES.join(", ")},
  "interested": true, false, or null if not stated,
  "keyObjection": "the main hesitation mentioned, if any, otherwise omit this field entirely",
  "nextAction": "a short, concrete next step based only on what's written",
  "followUpDate": "ONLY include this field if the notes state a specific day/time (e.g. 'Friday', 'tomorrow'). Never invent or infer a date. Omit entirely if none was mentioned.",
  "priority": one of ${VALID_PRIORITIES.join(", ")}
}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            console.error(`[ManualCallExtraction] API request failed: status=${response.status} body=${errorText}`);
            return null;
        }

        const data = await response.json();
        const responseText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("[ManualCallExtraction] No JSON found in model response");
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            summaryText: parsed.summaryText || rawNotes,
            callOutcome: VALID_OUTCOMES.includes(parsed.callOutcome) ? parsed.callOutcome : "FOLLOW_UP_REQUIRED",
            interested: typeof parsed.interested === "boolean" ? parsed.interested : null,
            keyObjection: parsed.keyObjection || undefined,
            nextAction: parsed.nextAction || undefined,
            followUpDate: parsed.followUpDate || undefined,
            priority: VALID_PRIORITIES.includes(parsed.priority) ? parsed.priority : "MEDIUM",
        };
    } catch (err) {
        console.error("[ManualCallExtraction] Failed to extract summary:", err);
        return null;
    }
}