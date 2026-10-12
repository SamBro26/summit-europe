import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { isPremiumSubscription } from "@/lib/billing";

function iso(seconds?: number | null) {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function syncSubscription(subscription: any, env: StripeEnv) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id
    || (subscription.metadata?.tier ? `premium_${subscription.metadata.tier}` : item?.price?.id);
  const periodStart = iso(item?.current_period_start ?? subscription.current_period_start);
  const periodEnd = iso(item?.current_period_end ?? subscription.current_period_end);

  let userId: string | undefined = subscription.metadata?.userId;
  if (!userId) {
    const { data } = await supabaseAdmin.from("subscriptions").select("user_id")
      .eq("stripe_subscription_id", subscription.id).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) { console.error("No userId for subscription", subscription.id); return; }

  await supabaseAdmin.from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
    product_id: typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id,
    price_id: priceId,
    status: subscription.status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });

  // Only live payments grant premium on the published app; test payments do in the preview.
  const premium = isPremiumSubscription(subscription.status, periodEnd);
  await supabaseAdmin.from("profiles").update(
    premium
      ? { is_premium: true, subscription_status: "active_paid" }
      : { is_premium: false, subscription_status: "free_with_ads" },
  ).eq("id", userId);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") return Response.json({ received: true, ignored: "invalid env" });
        try {
          const event = await verifyWebhook(request, rawEnv);
          switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
              await syncSubscription(event.data.object, rawEnv);
              break;
            default:
              console.log("Unhandled event:", event.type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
