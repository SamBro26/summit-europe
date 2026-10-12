import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { QUARTERLY, TIER_PRICE_IDS, type TierId } from "@/lib/billing";

type Stripe = ReturnType<typeof createStripeClient>;

async function resolveOrCreateCustomer(stripe: Stripe, options: { email?: string | undefined; userId: string }): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
  const hit = found.data[0];
  if (hit) return hit.id;
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, { metadata: { ...customer.metadata, userId: options.userId } });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { tier: TierId; returnUrl: string; environment: StripeEnv }) => {
    if (!(data.tier in TIER_PRICE_IDS)) throw new Error("Invalid tier");
    if (data.environment !== "sandbox" && data.environment !== "live") throw new Error("Invalid environment");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    try {
      const { userId, claims } = context;
      const email = (claims as { email?: string }).email;
      const stripe = createStripeClient(data.environment);

      // Monthly price carries the Premium product; quarterly is built inline on it.
      const monthly = await stripe.prices.list({ lookup_keys: [TIER_PRICE_IDS.monthly] });
      const monthlyPrice = monthly.data[0];
      if (!monthlyPrice) throw new Error("Price not found");
      const productId = typeof monthlyPrice.product === "string" ? monthlyPrice.product : monthlyPrice.product.id;

      let lineItem: Record<string, unknown>;
      if (data.tier === "quarterly") {
        lineItem = {
          price_data: {
            currency: QUARTERLY.currency,
            product: productId,
            unit_amount: QUARTERLY.unitAmount,
            recurring: { interval: QUARTERLY.interval, interval_count: QUARTERLY.intervalCount },
            tax_behavior: "inclusive",
          },
          quantity: 1,
        };
      } else {
        const prices = data.tier === "monthly" ? monthly : await stripe.prices.list({ lookup_keys: [TIER_PRICE_IDS[data.tier]] });
        const price = prices.data[0];
        if (!price) throw new Error("Price not found");
        lineItem = { price: price.id, quantity: 1 };
      }

      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });
      const session = await stripe.checkout.sessions.create({
        line_items: [lineItem],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        managed_payments: { enabled: true },
        metadata: { userId, tier: data.tier, managed_payments: "true" },
        subscription_data: { metadata: { userId, tier: data.tier } },
      } as Parameters<Stripe["checkout"]["sessions"]["create"]>[0]);
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) return { error: "No subscription found" };
    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
