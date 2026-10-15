import { request, requestVoid } from './http-client'
import { profileSchema, type ChangePasswordInput, type UpdateProfileInput } from './contracts/profile'

export function fetchProfile(signal?: AbortSignal) {
  return request(profileSchema, { method: 'GET', url: '/profile', signal })
}

export function updateProfile(input: UpdateProfileInput) {
  return request(profileSchema, { method: 'PATCH', url: '/profile', data: input })
}

export function updateAvatar(dataUrl: string) {
  return request(profileSchema, { method: 'PUT', url: '/profile/avatar', data: { dataUrl } })
}

export function removeAvatar() {
  return request(profileSchema, { method: 'DELETE', url: '/profile/avatar' })
}

export function changePassword(input: ChangePasswordInput) {
  return requestVoid({ method: 'POST', url: '/profile/password', data: input })
}
