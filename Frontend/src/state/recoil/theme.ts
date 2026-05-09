import { atom } from 'recoil'

export type ThemeMode = 'dark' | 'light'

const savedTheme = (localStorage.getItem('cinestar_theme') as ThemeMode) || 'dark'

export const themeState = atom<ThemeMode>({
  key: 'themeState',
  default: savedTheme,
  effects: [
    ({ onSet }) => {
      onSet((newTheme) => {
        localStorage.setItem('cinestar_theme', newTheme)
        if (newTheme === 'light') {
          document.body.classList.add('theme-light')
        } else {
          document.body.classList.remove('theme-light')
        }
      })
    },
  ],
})
