// Topical line icons for the "Shop by category" row — kept separate from the
// app-wide Icon set since these glyphs are only ever used here. Same drawing
// conventions as src/components/Icon.tsx: 24x24 viewBox, stroke-based,
// inherits color via currentColor. Keyed by the exact category strings in
// src/lib/brands.ts (CATEGORIES); anything unmapped falls back to a gift tag.

type PathSet = React.ReactNode;

const CATEGORY_PATHS: Record<string, PathSet> = {
  Beauty: <path d="M12 3l1.6 6.4L20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3z" />,
  Entertainment: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="9.5" x2="21" y2="9.5" />
      <line x1="3" y1="14.5" x2="21" y2="14.5" />
      <line x1="8.5" y1="4" x2="8.5" y2="20" />
      <line x1="15.5" y1="4" x2="15.5" y2="20" />
    </>
  ),
  Fashion: <path d="M8.5 3.5 4 6.5l2 3 2-1.2V20h8V8.3l2 1.2 2-3-4.5-3c-1 2-5.5 2-6.5 0z" />,
  "Food & Drink": (
    <>
      <path d="M7 3v18M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3" />
      <path d="M16 3c2.5 1 2.5 7.5 0 9v9" />
    </>
  ),
  Gaming: (
    <>
      <rect x="2.5" y="7.5" width="19" height="9" rx="4.5" />
      <line x1="7" y1="10" x2="7" y2="14" />
      <line x1="5" y1="12" x2="9" y2="12" />
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="13" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  "Gas & Auto": (
    <>
      <path d="M4 13 6 7.5A2 2 0 0 1 8 6h8a2 2 0 0 1 2 1.5L20 13M4 13h16v4H4z" />
      <circle cx="7.5" cy="17" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="17" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  Grocery: (
    <>
      <path d="M5 9h14l-1.4 10.2a1 1 0 0 1-1 .8H7.4a1 1 0 0 1-1-.8L5 9z" />
      <path d="M9.5 9 11 4M14.5 9 13 4" />
      <line x1="9.5" y1="12.5" x2="9.5" y2="16.5" />
      <line x1="14.5" y1="12.5" x2="14.5" y2="16.5" />
    </>
  ),
  Home: <path d="M4 11 12 4l8 7M6 10v10h12V10" />,
  Kids: (
    <>
      <ellipse cx="12" cy="9" rx="5" ry="6" />
      <path d="M12 15v4M11 19h2" />
    </>
  ),
  Mastercard: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  Shopping: <path d="M6 8h12l1 11.2a1 1 0 0 1-1 .8H6a1 1 0 0 1-1-.8L6 8zM9 8V6a3 3 0 0 1 6 0v2" />,
  "Sports & Outdoors": (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" />
      <path d="M12 13v4M9 20h6M10.5 17h3v3h-3z" />
    </>
  ),
  Tech: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="1" />
      <path d="M2 20h20l-2-4H4l-2 4z" />
    </>
  ),
  Travel: <path d="M22 3 2 10.5l7.5 2.8L12 21l3-6 7-12zM9.5 13.3 22 3" />,
  Visa: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
};

const FALLBACK: PathSet = (
  <>
    <rect x="3" y="8.5" width="18" height="4" />
    <rect x="5" y="12.5" width="14" height="8" />
    <line x1="12" y1="8.5" x2="12" y2="20.5" />
    <path d="M12 8.5C10.5 5 6 5.3 6 8c0 .8.6.5 6 .5ZM12 8.5C13.5 5 18 5.3 18 8c0 .8-.6.5-6 .5Z" />
  </>
);

export function CategoryIcon({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {CATEGORY_PATHS[name] ?? FALLBACK}
    </svg>
  );
}
