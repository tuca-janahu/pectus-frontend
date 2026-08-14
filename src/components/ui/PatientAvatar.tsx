import { Avatar, type AvatarColor } from './Avatar'

export interface PatientAvatarPatient {
  initials: string
  color?: AvatarColor
}

export interface PatientAvatarProps {
  patient?: PatientAvatarPatient | null
  size?: number
  ring?: boolean
}

export function PatientAvatar({ patient, size = 40, ring }: PatientAvatarProps) {
  if (!patient) return null
  return <Avatar initials={patient.initials} color={patient.color} size={size} ring={ring} />
}
