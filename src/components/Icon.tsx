// Minimal hand-drawn icon set (no external icon library) — replaces emoji
// throughout the app for a more consistent, professional look. Stroke-based,
// 24x24 viewBox, inherits color via currentColor.

export type IconName =
  | "search" | "cart" | "x" | "lock" | "package" | "mail" | "zap" | "shield"
  | "checkCircle" | "messageCircle" | "wallet" | "chevronRight" | "chevronDown" | "gift"
  | "undo" | "loader" | "inbox" | "copy" | "code";

const paths: Record<IconName, React.ReactNode> = {
  code: (
    <>
      <polyline points="16 18 22 12 16 6" fill="none" />
      <polyline points="8 6 2 12 8 18" fill="none" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M2.5 3h2l2.4 12.1a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" />
    </>
  ),
  x: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
    </>
  ),
  package: (
    <>
      <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7Z" />
      <path d="M3 8.5 12 14l9-5.5" />
      <line x1="12" y1="14" x2="12" y2="21" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </>
  ),
  zap: <path d="M13 2 4 13.5h6.5L11 22l9-11.5h-6.5L13 2Z" />,
  shield: <path d="M12 3 4.5 6v6c0 4.6 3.2 7.8 7.5 9 4.3-1.2 7.5-4.4 7.5-9V6L12 3Z" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </>
  ),
  messageCircle: <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.7-.3-3.9-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />,
  wallet: (
    <>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h11A2.5 2.5 0 0 1 19 7.5" />
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <circle cx="16" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  chevronRight: <polyline points="9 6 15 12 9 18" />,
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  gift: (
    <>
      <rect x="3" y="8.5" width="18" height="4" />
      <rect x="5" y="12.5" width="14" height="8" />
      <line x1="12" y1="8.5" x2="12" y2="20.5" />
      <path d="M12 8.5C10.5 5 6 5.3 6 8c0 .8.6.5 6 .5Z" />
      <path d="M12 8.5C13.5 5 18 5.3 18 8c0 .8-.6.5-6 .5Z" />
    </>
  ),
  undo: <path d="M3 10h10a5 5 0 0 1 0 10H8M3 10l4-4M3 10l4 4" />,
  loader: <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.4-6.4-2.1 2.1M8.7 15.3l-2.1 2.1m12.8 0-2.1-2.1M8.7 8.7 6.6 6.6" />,
  inbox: (
    <>
      <path d="M3 12h4.5l1.5 3h6l1.5-3H21" />
      <path d="M5 5h14l2 7v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7l2-7Z" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>
  ),
};

export function Icon({ name, size = 18, className = "", strokeWidth = 2 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
