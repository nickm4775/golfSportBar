interface BrandLogoProps {
  className?: string
  compact?: boolean
  mark?: boolean
}

export function BrandLogo({ className = '', compact = false, mark = false }: BrandLogoProps) {
  if (mark) {
    const size = compact ? 'h-8 w-8' : 'h-10 w-10'
    return (
      <img
        src="/brand/mark.png"
        alt="Golf Sport Bar"
        className={`${size} object-contain ${className}`}
      />
    )
  }

  const height = compact ? 'h-8 md:h-9' : 'h-[4.5rem] md:h-24'

  return (
    <span className={`inline-flex items-center ${className}`} role="img" aria-label="Golf Sport Bar">
      <img
        src="/brand/logo-on-light.png"
        alt=""
        className={`${height} w-auto max-w-[min(100%,18rem)] object-contain dark:hidden`}
      />
      <img
        src="/brand/logo-on-dark.png"
        alt=""
        className={`hidden ${height} w-auto max-w-[min(100%,18rem)] object-contain dark:block`}
      />
    </span>
  )
}
