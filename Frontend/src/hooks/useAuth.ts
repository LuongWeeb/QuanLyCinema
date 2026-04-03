import { useRecoilValue, useSetRecoilState } from 'recoil'
import { currentUserState } from '../state/recoil/auth'
export function useAuth() {
  const currentUser = useRecoilValue(currentUserState)
  const setCurrentUser = useSetRecoilState(currentUserState)

  return {
    currentUser,
    isLoggedIn: Boolean(currentUser?.accessToken),
    setCurrentUser,
    logout: () => setCurrentUser(null),
  }
}
