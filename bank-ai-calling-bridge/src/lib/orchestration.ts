import { getNextCallForCampaign, updateCallStatus } from './internalApi';
import { initiateCall } from './twilio';
import { campaignQueue } from './campaignQueue';


export async function triggerNextCampaignCall(campaignId: string): Promise<void> {
    console.log(`[Orchestration] Checking for next customer in campaign ${campaignId}...`);

    try {
        const next = await getNextCallForCampaign(campaignId);

        if (next.done || !next.call || !next.customer) {
            console.log(`[Orchestration] Campaign ${campaignId} has no more pending customers.`);
            return;
        }

        console.log(`[Orchestration] Calling ${next.customer.name} (${next.customer.phoneNumber}) — call ${next.call.id}`);

        try {
            const callSid = await initiateCall(next.customer.phoneNumber, next.call.id);
            await updateCallStatus(next.call.id, 'RINGING', callSid);
            console.log(`[Orchestration] Call placed successfully: ${callSid}`);
        } catch (err) {
            console.error(`[Orchestration] Failed to place call for ${next.call.id}:`, err);
            await updateCallStatus(next.call.id, 'FAILED').catch(() => {});
            await campaignQueue.add(
                'trigger-campaign',
                { campaignId },
                { delay: 2000 }
            );
        }
    } catch (err) {
        console.error('[Orchestration] Critical error checking next campaign call:', err);
    }
}