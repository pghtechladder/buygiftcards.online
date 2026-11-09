import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationOtpEmail } from "@/lib/email";

const SIGNING_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.PAYPAL_WEBHOOK_ID ||
  "bgc_email_verification_secret_prod_key_2026";

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Creates and stores a 15-minute OTP in VerificationToken and sends an email to the recipient.
 */
export async function createAndSendVerificationOtp(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: "Please provide a valid email address." };
  }

  const otp = generateOtp();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  try {
    // Delete any previous pending tokens for this email to prevent multiple valid OTPs
    try {
      await prisma.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      });
    } catch (e) {
      console.warn("[email-verification] Failed to delete previous tokens:", e);
    }

    // Save token with identifier + email-scoped unique token string
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: `${normalizedEmail}:${otp}`,
        expires,
      },
    });

    const emailRes = await sendVerificationOtpEmail(normalizedEmail, otp);
    if (!emailRes.sent && emailRes.error) {
      console.warn("[email-verification] Failed to send via SMTP:", emailRes.error);
    }

    return { success: true };
  } catch (err) {
    console.error("[email-verification] Error creating OTP:", err);
    return { success: false, error: "Could not send verification code. Please try again." };
  }
}

/**
 * Signs an HMAC-SHA256 verification proof token valid for 24 hours.
 * Allows guest checkout and current checkout sessions to prove email verification.
 */
export function signEmailVerificationProof(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const timestamp = Date.now();
  const payload = `${normalizedEmail}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", SIGNING_SECRET);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  const encoded = Buffer.from(`${payload}:${signature}`, "utf-8").toString("base64url");
  return `bgc_v1_${encoded}`;
}

/**
 * Verifies an HMAC-SHA256 email verification proof token.
 */
export function verifyEmailVerificationProof(
  email: string,
  token?: string | null
): boolean {
  if (!token || !token.startsWith("bgc_v1_")) return false;
  try {
    const raw = token.slice("bgc_v1_".length);
    const decoded = Buffer.from(raw, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;
    const [tokenEmail, tokenTimestampStr, signature] = parts;
    const tokenTimestamp = parseInt(tokenTimestampStr, 10);

    // Expire proof after 24 hours
    if (Date.now() - tokenTimestamp > 24 * 60 * 60 * 1000) {
      return false;
    }

    if (tokenEmail.toLowerCase() !== email.trim().toLowerCase()) {
      return false;
    }

    const payload = `${tokenEmail}:${tokenTimestampStr}`;
    const hmac = crypto.createHmac("sha256", SIGNING_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Validates a submitted 6-digit OTP code against the database.
 * If valid, marks the User as emailVerified (if an account exists) and returns a signed proof token.
 */
export async function verifyOtpCode(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string; verificationToken?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  if (!cleanOtp || cleanOtp.length !== 6) {
    return { success: false, error: "Please enter a valid 6-digit verification code." };
  }

  try {
    const record = await prisma.verificationToken.findUnique({
      where: {
        token: `${normalizedEmail}:${cleanOtp}`,
      },
    });

    if (!record || record.identifier !== normalizedEmail) {
      return { success: false, error: "Invalid verification code. Please check and try again." };
    }

    if (new Date() > record.expires) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token: record.token },
      }).catch(() => null);
      return { success: false, error: "Verification code has expired. Please request a new one." };
    }

    // Code is valid: delete it so it cannot be reused
    await prisma.verificationToken.delete({
      where: { token: record.token },
    }).catch(() => null);

    // If a user account exists with this email, mark it emailVerified in the database
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { emailVerified: new Date() },
        });
      }
    } catch (e) {
      console.warn("[email-verification] Could not update User.emailVerified:", e);
    }

    const verificationToken = signEmailVerificationProof(normalizedEmail);
    return { success: true, verificationToken };
  } catch (err) {
    console.error("[email-verification] Error verifying OTP:", err);
    return { success: false, error: "An error occurred while verifying the code." };
  }
}

/**
 * Checks if an email address is verified.
 * Returns true if:
 * 1. The user account in the database has emailVerified != null
 * 2. OR a valid, unexpired HMAC verification proof token is supplied for this email.
 */
export async function isEmailVerified(
  email: string,
  clientProofToken?: string | null
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;

  // Check signed client proof token (covers guest checkout and immediate post-verify flow)
  if (clientProofToken && verifyEmailVerificationProof(normalizedEmail, clientProofToken)) {
    return true;
  }

  // Check database user record
  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { emailVerified: true },
    });
    if (user && user.emailVerified) {
      return true;
    }
  } catch (err) {
    console.error("[email-verification] DB check failed:", err);
  }

  return false;
}

