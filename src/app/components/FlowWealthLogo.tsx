interface FlowWealthLogoProps {
  size?: number;
}

export function FlowWealthLogo({ size = 32 }: FlowWealthLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Background gradient: mint top-left → sky-blue bottom-right */}
        <linearGradient id="fw-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9de4c8" />
          <stop offset="50%" stopColor="#b8d8ee" />
          <stop offset="100%" stopColor="#a0c8e8" />
        </linearGradient>

        {/* S-ribbon gradient: soft cream sheen */}
        <linearGradient id="fw-ribbon" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cbc6b2" />
          <stop offset="45%" stopColor="#e6e1d2" />
          <stop offset="100%" stopColor="#d4cfc0" />
        </linearGradient>

        {/* Subtle depth shadow for the ribbon */}
        <linearGradient id="fw-shadow-ribbon" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9e9a8c" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#9e9a8c" stopOpacity="0.1" />
        </linearGradient>

        {/* Drop shadow filter */}
        <filter id="fw-drop" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0.5" dy="2" stdDeviation="2.5" floodColor="rgba(0,60,50,0.22)" />
        </filter>
      </defs>

      {/* Rounded square background */}
      <rect width="100" height="100" rx="22" ry="22" fill="url(#fw-bg)" />

      {/* Inner glow on background */}
      <rect width="100" height="100" rx="22" ry="22" fill="white" opacity="0.12" />

      {/* ── S-curve ribbon ── */}
      {/* The path flows from bottom-left (26,74) through the mid-point (50,50)
          to top-right (74,26) describing the S shape */}

      {/* Depth layer (slightly thicker, dark) */}
      <path
        d="M 26,74 C 9,58 21,50 50,50 C 79,50 91,42 74,26"
        stroke="url(#fw-shadow-ribbon)"
        strokeWidth="19"
        strokeLinecap="round"
        fill="none"
      />

      {/* Main ribbon */}
      <path
        d="M 26,74 C 9,58 21,50 50,50 C 79,50 91,42 74,26"
        stroke="url(#fw-ribbon)"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
        filter="url(#fw-drop)"
      />

      {/* Inner highlight line (gives the 3-D ribbon feel) */}
      <path
        d="M 29,70 C 14,56 24,50 50,50 C 76,50 86,43 71,29"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />

      {/* ── Top-right arrowhead (points upper-right, ~45°) ── */}
      {/* Tip at (80,20), base pulled back toward lower-left */}
      <polygon
        points="80,20 68,23 71,35"
        fill="url(#fw-ribbon)"
        filter="url(#fw-drop)"
      />
      {/* Highlight on top arrow */}
      <polygon
        points="80,20 68,23 71,28"
        fill="white"
        opacity="0.3"
      />

      {/* ── Bottom-left arrowhead (points lower-left, ~45°) ── */}
      {/* Tip at (20,80), base pulled back toward upper-right */}
      <polygon
        points="20,80 32,77 29,65"
        fill="url(#fw-ribbon)"
        filter="url(#fw-drop)"
      />
      {/* Highlight on bottom arrow */}
      <polygon
        points="20,80 32,77 29,72"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
}
