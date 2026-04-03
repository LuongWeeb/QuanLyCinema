import { atom, selector } from 'recoil'
import type { LoginResponse } from '../../types/auth'

const STORAGE_USER = 'currentUser'
const STORAGE_TOKEN = 'token'

function readStoredUser(): LoginResponse | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_USER)
  if (!raw) return null
  try {
    const u = JSON.parse(raw) as LoginResponse
    if (u?.accessToken) {
      // `httpClient` reads token from localStorage. When we hydrate auth state from
      // `currentUser`, ensure the `token` key exists too.
      localStorage.setItem(STORAGE_TOKEN, u.accessToken)
      return u
    }
    return null
  } catch {
    return null
  }
}

/** User đăng nhập; đồng bộ `localStorage` (token + currentUser) cho `httpClient`. */
export const currentUserState = atom<LoginResponse | null>({
  key: 'currentUserState',
  default: readStoredUser(),
  effects: [
    ({ onSet }) => {
      onSet((newValue) => {
        if (newValue == null) {
          localStorage.removeItem(STORAGE_USER)
          localStorage.removeItem(STORAGE_TOKEN)
        } else {
          localStorage.setItem(STORAGE_USER, JSON.stringify(newValue))
          localStorage.setItem(STORAGE_TOKEN, newValue.accessToken)
        }
      })
    },
  ],
})

export const isStaffOrAdminSelector = selector({
  key: 'isStaffOrAdminSelector',
  get: ({ get }) => {
    const u = get(currentUserState)
    if (!u?.accessToken) return false
    return ['admin', 'staff'].includes(u.role.toLowerCase())
  },
})
