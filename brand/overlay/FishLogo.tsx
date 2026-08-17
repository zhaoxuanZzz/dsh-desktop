import type { IconProps } from './icons/props.ts'

export function FishLogo({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 1024 1024"
      fill="none"
      aria-hidden="true"
    >
      <path d="M220 620 C360 420, 664 420, 804 620" fill="none" stroke="currentColor" strokeWidth="72" strokeLinecap="round"/>
      <path d="M340 700 C512 560, 684 700, 684 700" fill="none" stroke="currentColor" strokeWidth="48" strokeLinecap="round" opacity="0.65"/>
    </svg>
  )
}
