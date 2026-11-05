import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidPassword, PASSWORD_RULE_TEXT } from "@/lib/passwordRules";
import { subscribeToKit } from "@/lib/newsletter";

const BodySchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().email(),
    phone: z.string().trim().optional(),
    password: z.string().refine(isValidPassword, PASSWORD_RULE_TEXT),
    confirmPassword: z.string(),
    marketingOptIn: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid registration details";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { firstName, lastName, phone, password, marketingOptIn } = parsed.data;
    const email = parsed.data.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const createdUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone: phone ?? null,
        passwordHash,
        marketingOptIn: marketingOptIn ?? false,
      },
    });

    // Automatically attach any guest/PayPal orders placed with this same email ID
    try {
      await prisma.order.updateMany({
        where: {
          customerEmail: { equals: email, mode: "insensitive" },
          userId: null,
        },
        data: { userId: createdUser.id },
      });
    } catch (err) {
      console.warn("[/api/auth/register] Failed to link existing orders for email:", err);
    }

    // A registration with the newsletter box checked should double-count as
    // a newsletter signup — reuse the same save-locally-first pattern as
    // src/app/api/subscribe/route.ts. Never fail registration over this.
    if (marketingOptIn) {
      try {
        const existingSub = await prisma.newsletterSubscriber.findUnique({ where: { email } });
        if (!existingSub) {
          let synced = false;
          try {
            const result = await subscribeToKit(email);
            synced = result.synced;
          } catch (err) {
            console.error("[/api/auth/register] Kit.com sync failed, subscriber still saved locally:", err);
          }
          await prisma.newsletterSubscriber.create({ data: { email, syncedToKit: synced } });
        }
      } catch (err) {
        console.error("[/api/auth/register] Newsletter signup failed, registration still succeeded:", err);
      }
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[/api/auth/register]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
