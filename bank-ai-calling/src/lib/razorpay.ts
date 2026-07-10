
import Razorpay from "razorpay";

let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!client) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      throw new Error("Razorpay credentials missing — check RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET in .env");
    }

    client = new Razorpay({ key_id, key_secret });
  }
  return client;
}