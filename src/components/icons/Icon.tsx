import type { CSSProperties, SVGProps } from 'react'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'style'> {
  size?: number
  style?: CSSProperties
}

const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function Icon({ size = 20, style, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg {...BASE} {...rest} className="shrink-0" style={{ width: size, height: size, ...style }}>
      {children}
    </svg>
  )
}
