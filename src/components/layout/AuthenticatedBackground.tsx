export function AuthenticatedBackground() {
  return (
    <div
      aria-hidden
      className="authenticated-bg-root pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="authenticated-bg-base absolute inset-0" />
      <div className="authenticated-bg-mesh absolute inset-0" />
      <div className="authenticated-bg-grid absolute inset-0" />
      <div className="authenticated-bg-noise-layer absolute inset-0" />

      <div className="authenticated-bg-orb authenticated-bg-orb-a" />
      <div className="authenticated-bg-orb authenticated-bg-orb-b" />
      <div className="authenticated-bg-orb authenticated-bg-orb-c" />

      <div className="authenticated-bg-topo absolute inset-0">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M -10 28 C 12 20, 28 36, 48 26 S 82 14, 110 24" fill="none" stroke="rgba(15,23,42,0.045)" strokeWidth="0.26" />
          <path d="M -10 38 C 14 28, 32 46, 54 34 S 88 22, 110 34" fill="none" stroke="rgba(255,107,0,0.04)" strokeWidth="0.24" />
          <path d="M -10 48 C 16 36, 36 56, 58 44 S 92 32, 110 44" fill="none" stroke="rgba(15,23,42,0.04)" strokeWidth="0.24" />
          <path d="M -10 58 C 18 46, 38 66, 62 54 S 94 42, 110 54" fill="none" stroke="rgba(255,107,0,0.035)" strokeWidth="0.22" />
          <path d="M -10 68 C 16 58, 36 74, 60 64 S 90 52, 110 62" fill="none" stroke="rgba(15,23,42,0.035)" strokeWidth="0.22" />
          <path d="M -10 78 C 14 70, 34 84, 58 74 S 88 62, 110 72" fill="none" stroke="rgba(255,107,0,0.03)" strokeWidth="0.2" />
        </svg>
      </div>

      <svg
        className="authenticated-bg-geometry absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="authArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle cx="1220" cy="100" r="100" fill="none" stroke="rgba(255,107,0,0.07)" strokeWidth="1" strokeDasharray="5 12" />
        <circle cx="1220" cy="100" r="62" fill="none" stroke="rgba(255,107,0,0.05)" strokeWidth="0.75" />

        <circle cx="140" cy="820" r="88" fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth="1" strokeDasharray="4 10" />
        <circle cx="140" cy="820" r="52" fill="none" stroke="rgba(15,23,42,0.04)" strokeWidth="0.75" />

        <path
          d="M 1340 700 A 180 180 0 0 1 1160 860"
          fill="none"
          stroke="url(#authArcGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <div className="authenticated-bg-vignette absolute inset-0" />
    </div>
  );
}
