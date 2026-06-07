import { NextRequest, NextResponse } from "next/server";
import { stripe, TRIAL_PERIOD_DAYS } from "@/lib/stripe";
import { getSupabaseAdminSingleton } from "@/lib/supabase";

function getSB() {
  const sb = getSupabaseAdminSingleton();
  if (!sb) throw new Error("Database not configured");
  return sb;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") as string;

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const sb = getSB();

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          await sb.from("subscriptions").upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            status: "active",
            trial_end: new Date(
              Date.now() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000
            ).toISOString(),
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Payment successful — keep subscription active
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await sb
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("user_id", userId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}
