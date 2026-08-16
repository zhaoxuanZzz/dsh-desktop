import type { IconProps } from './icons/props.ts'

export function BrandWordmark({ size = 24, className }: IconProps) {
  return (
    <svg
      width={(size * 182) / 24}
      height={size}
      className={className}
      viewBox="0 0 182 24"
      fill="none"
      aria-hidden="true"
    >
      <g transform="translate(0 -2) scale(0.028)">
        <path d="M220 620 C360 420, 664 420, 804 620" fill="none" stroke="currentColor" strokeWidth="72" strokeLinecap="round"/>
        <path d="M340 700 C512 560, 684 700, 684 700" fill="none" stroke="currentColor" strokeWidth="48" strokeLinecap="round" opacity="0.65"/>
      </g>
      <text x="36" y="17" fill="currentColor" fontFamily="system-ui, -apple-system, Segoe UI, sans-serif" fontSize="14" fontWeight="600">Saddle</text>
    </svg>
  )
}
