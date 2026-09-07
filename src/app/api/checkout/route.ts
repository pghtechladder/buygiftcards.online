import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { getBrand, isValidDenomination, chargeAmountCents } from "@/lib/brands";
import { auth } from "@/lib/auth";

const CartItemSchema = z.object({
  brandSlug: z.string(),
  amount: z.number().positive(),
  qty: z.number().int().min(1).max(10),
  deliveryType: z.enum(["egift", "physical"]),
  customPhotoUrl: z.string().url().optional(),
});
const BodySchema = z.object({
  items: z.array(CartItemSchema).min(1).max(20),
  // Generated once per checkout attempt on the client and reused on retry,
  // so a double-click or a flaky network retry can't create two Stripe
  // Checkout Sessions (and charge the card twice) for the same cart.
  idempotencyKey: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // If the customer is signed in, we link the resulting order to their
    // account (and pre-fill their email at Stripe Checkout) — but guest
    // checkout (no session) keeps working exactly as before.
    const authSession = await auth();
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const line_items: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; images?: string[]; metadata: Record<string, string> };
        unit_amount: number;
      };
      quantity: number;
    }> = [];
    // Parallel array (by index) of validated photo URLs per cart line, used
    // below to build the metadata Stripe sends back on the webhook.
    const photoByLine: (string | undefined)[] = [];

    // Every line item is re-priced from the server-side catalog. The client
    // cart is a convenience UI — it is never trusted for what gets charged.
    for (const item of parsed.data.items) {
      const brand = getBrand(item.brandSlug);
      if (!brand) return NextResponse.json({ error: `Unknown brand: ${item.brandSlug}` }, { status: 400 });
      if (brand.type !== "both" && brand.type !== item.deliveryType) {
        return NextResponse.json({ error: `${brand.name} does not support ${item.deliveryType} delivery` }, { status: 400 });
      }
      const amountCents = Math.round(item.amount * 100);
      if (!isValidDenomination(brand, amountCents)) {
        return NextResponse.json({ error: `Invalid amount for ${brand.name}` }, { status: 400 });
      }
      // What we actually charge can be less than face value (e.g. Starbucks'
      // 5% discount) — the customer still receives a gift card worth the
      // full face amount; we just collect less for it. Face value (item.amount)
      // is what gets recorded/issued, computed below and carried in metadata.
      const chargeCents = chargeAmountCents(brand, item.amount);
      // Only trust a custom photo for brands that actually support it, and
      // only if it's really hosted on our own Blob storage — never pass an
      // arbitrary client-supplied URL through to Stripe/our DB unchecked.
      let customPhotoUrl: string | undefined;
      if (item.customPhotoUrl) {
        if (!brand.supportsCustomPhoto) {
          return NextResponse.json({ error: `${brand.name} does not support custom photos` }, { status: 400 });
        }
        if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(item.customPhotoUrl)) {
          return NextResponse.json({ error: "Invalid photo URL" }, { status: 400 });
        }
        customPhotoUrl = item.customPhotoUrl;
      }

      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${brand.name} ${item.deliveryType === "egift" ? "eGift" : "Physical"} Card — $${item.amount}${
              brand.discountPercent ? ` (${brand.discountPercent}% off)` : ""
            }`,
            images: customPhotoUrl ? [customPhotoUrl] : undefined,
            metadata: { brandSlug: brand.slug, amount: String(item.amount), deliveryType: item.deliveryType },
          },
          unit_amount: chargeCents,
        },
        quantity: item.qty,
      });
      photoByLine.push(customPhotoUrl);
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items,
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/catalog`,
        customer_creation: "always",
        // Stripe Tax: needs a customer address to know which jurisdiction to
        // calculate for, hence requiring billing address collection here.
        // NOTE: you still need to (1) add tax registrations for every state
        // you're collecting tax in at dashboard.stripe.com/settings/tax, and
        // (2) confirm the right product tax category for gift cards there —
        // don't guess a tax code in code for something with real tax/legal
        // consequences. Until registrations exist, Stripe will calculate $0
        // tax rather than fail, so this is safe to ship ahead of that setup.
        automatic_tax: { enabled: true },
        billing_address_collection: "required",
        ...(authSession?.user?.email ? { customer_email: authSession.user.email } : {}),
        metadata: {
          cart: JSON.stringify(
            parsed.data.items.map((i, idx) => ({
              s: i.brandSlug,
              a: i.amount,
              q: i.qty,
              d: i.deliveryType,
              ...(photoByLine[idx] ? { p: photoByLine[idx] } : {}),
            }))
          ),
          ...(authSession?.user?.id ? { u: authSession.user.id } : {}),
        },
      },
      parsed.data.idempotencyKey ? { idempotencyKey: parsed.data.idempotencyKey } : undefined
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Stripe auth errors, network errors, etc. — always return JSON so the
    // client's res.json() never chokes on an empty/HTML error body.
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[/api/checkout]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
