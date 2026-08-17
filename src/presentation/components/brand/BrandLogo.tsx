interface BrandLogoProps {
  className?: string
  compact?: boolean
}

export function BrandLogo({ className = '', compact = false }: BrandLogoProps) {
  return (
    <div className={`inline-flex flex-col items-start leading-none ${className}`}>
      <span
        className={`font-script text-[var(--gsb-fg)] ${compact ? 'text-2xl' : 'text-5xl md:text-6xl'}`}
        aria-hidden
      >
        G
        <span className="relative inline-block px-[0.04em] align-baseline">
          <span className="invisible">o</span>
          <svg
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[42%] ${compact ? 'size-4' : 'size-7 md:size-9'}`}
            viewBox="0 0 48 48"
            aria-hidden
          >
            <circle
              cx="24"
              cy="24"
              r="16"
              fill="#f7f8f6"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[var(--gsb-accent)]"
            />
            <path
              d="M18 18c3-4 9-5 13-2M31 31c-3 4-9 5-13 2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              className="text-[var(--gsb-accent)]"
              fill="none"
            />
            <circle cx="20" cy="22" r="1.4" className="fill-[var(--gsb-accent)]" />
            <circle cx="28" cy="26" r="1.4" className="fill-[var(--gsb-accent)]" />
          </svg>
        </span>
        lf
      </span>
      <span
        className={`mt-1 font-sans font-medium tracking-[0.32em] uppercase text-[var(--gsb-muted)] ${
          compact ? 'text-[0.6rem]' : 'text-[0.7rem] md:text-xs'
        }`}
      >
        Sport Bar
      </span>
    </div>
  )
}
