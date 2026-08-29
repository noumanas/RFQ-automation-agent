/**
 * The mark is a small hub-and-spoke: one supervisor node connected to three
 * agent nodes - the same shape as the architecture diagram - so the brand
 * mark and the product story reinforce each other instead of being generic.
 */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="9" fill="url(#rfq-logo-grad)" />
      <path
        d="M16 16L16 7.4M16 16L8.6 21M16 16L23.4 21"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="16" cy="7.4" r="2.4" fill="#fff" />
      <circle cx="8.6" cy="21" r="2.4" fill="#fff" />
      <circle cx="23.4" cy="21" r="2.4" fill="#fff" />
      <circle cx="16" cy="16" r="3.2" fill="#fff" />
      <defs>
        <linearGradient id="rfq-logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0891b2" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
