import { randomBytes, randomInt } from "crypto";

export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `BGC-${date}-${suffix}`;
}

export function generateGiftCardCode(): string {
  let digits = "";
  for (let i = 0; i < 16; i++) digits += randomInt(0, 10);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function generateGiftCardPin(): string {
  return String(randomInt(10000000, 99999999));
}

export const generateDemoCode = generateGiftCardCode;
export const generateDemoPin = generateGiftCardPin;
