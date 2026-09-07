// Single source of truth for the password complexity rule, shared by the
// registration/reset API routes (server-side, authoritative) and the
// AuthModal UI (client-side, for the inline helper text) so the two can
// never drift out of sync.
export const PASSWORD_RULE_TEXT =
  "Minimum 8 characters. Must contain at least 1 capital letter and 1 number or special character (for example, #!&?).";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9!@#$%^&*(),.?":{}|<>]).{8,}$/;

export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}
