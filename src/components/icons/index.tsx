import { Icon, type IconProps } from './Icon'

export { Icon }
export type { IconProps }

export const IconHome = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M10 21v-6h4v6" />
  </Icon>
)
export const IconCalendar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </Icon>
)
export const IconList = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 9h10M7 13h10M7 17h6" />
  </Icon>
)
export const IconUsers = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.5-3.5 3.2-6 6.5-6s6 2.5 6.5 6" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M21.5 18.5c-.3-2.4-2-4-4.5-4" />
  </Icon>
)
export const IconUser = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
  </Icon>
)
export const IconPlus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)
export const IconPlusCircle = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </Icon>
)
export const IconSearch = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
)
export const IconFilter = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 5h18l-7 9v6l-4-2v-4z" />
  </Icon>
)
export const IconBell = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 8H4c0-2 2-3 2-8Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Icon>
)
export const IconChevronLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="m15 6-6 6 6 6" />
  </Icon>
)
export const IconChevronRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
)
export const IconChevronDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)
export const IconChevronUp = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 15 6-6 6 6" />
  </Icon>
)
export const IconEdit = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20h4l11-11-4-4L4 16Z" />
    <path d="m13 5 4 4" />
  </Icon>
)
export const IconTrash = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </Icon>
)
export const IconEye = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)
export const IconEyeOff = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.5 6.2A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17.7 17.7 0 0 1-3.4 4.3" />
    <path d="M6.6 6.6A17 17 0 0 0 2 12s3.5 6 10 6c1.7 0 3.2-.4 4.5-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Icon>
)
export const IconMail = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
)
export const IconLock = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icon>
)
export const IconCamera = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="4" />
  </Icon>
)
export const IconLogOut = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M9 12h12" />
  </Icon>
)
export const IconSettings = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </Icon>
)
export const IconMenu = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </Icon>
)
export const IconClose = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)
export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12 5 5 9-11" />
  </Icon>
)
export const IconClock = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
)
export const IconStethoscope = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 3v6a4 4 0 0 0 8 0V3" />
    <path d="M5 3h2M11 3h2" />
    <path d="M9 13v3a4 4 0 0 0 8 0v-2" />
    <circle cx="17" cy="11" r="2" />
  </Icon>
)
export const IconActivity = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12h4l3-9 4 18 3-9h4" />
  </Icon>
)
export const IconMapPin = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13Z" />
    <circle cx="12" cy="9" r="3" />
  </Icon>
)
export const IconPhone = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4h4l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </Icon>
)
export const IconArrowLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </Icon>
)
export const IconCake = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 21h18M5 21V13a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8" />
    <path d="M3 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" />
    <path d="M12 7V4M12 4l-1.5-1.5M12 4l1.5-1.5" />
  </Icon>
)
export const IconChart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 3v18h18" />
    <rect x="7" y="11" width="3" height="6" rx=".5" />
    <rect x="12" y="7" width="3" height="10" rx=".5" />
    <rect x="17" y="13" width="3" height="4" rx=".5" />
  </Icon>
)
export const IconTrendUp = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 17l6-6 4 4 7-7" />
    <path d="M17 8h4v4" />
  </Icon>
)
export const IconVenus = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="5" />
    <path d="M12 13v8M9 18h6" />
  </Icon>
)
export const IconMars = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10" cy="14" r="5" />
    <path d="M14 10l6-6M15 4h5v5" />
  </Icon>
)
export const IconRefresh = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 12a9 9 0 1 1-2.6-6.3" />
    <path d="M21 4v5h-5" />
  </Icon>
)
export const IconClipboard = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
    <path d="M9 11h6M9 15h4" />
  </Icon>
)
export const IconMessage = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
  </Icon>
)
export const IconArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </Icon>
)
export const IconShield = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
)
export const IconLink = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 15l6-6" />
    <path d="M11 6.5 13 4.5a4 4 0 0 1 6 6l-2 2" />
    <path d="M13 17.5 11 19.5a4 4 0 0 1-6-6l2-2" />
  </Icon>
)
export const IconUserPlus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 19a5 5 0 0 0-10 0" />
    <circle cx="9" cy="8" r="3.2" />
    <path d="M18 8v6M21 11h-6" />
  </Icon>
)
export const IconLogo = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 2v4" />
    <path d="M9 6h6v4a3 3 0 0 1-3 3 3 3 0 0 1-3-3V6Z" />
    <path d="M12 13v3" />
    <circle cx="12" cy="19" r="3" />
  </Icon>
)

// Google "G" mark — multicolor, for OAuth sign-in / Google Calendar
export const IconGoogle = ({ size = 20, style, ...rest }: IconProps) => (
  <svg viewBox="0 0 48 48" width={size} height={size} style={{ flexShrink: 0, ...style }} {...rest}>
    <path
      fill="#EA4335"
      d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5Z"
    />
    <path
      fill="#4285F4"
      d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.3h12.4c-.5 2.9-2.1 5.4-4.6 7l7.6 5.9c4.4-4.1 6.7-10.1 6.7-17.6Z"
    />
    <path
      fill="#FBBC05"
      d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6.1Z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.1 0 11.3-2 15-5.5l-7.6-5.9c-2.1 1.4-4.8 2.3-7.4 2.3-6.4 0-11.7-3.7-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48Z"
    />
  </svg>
)
