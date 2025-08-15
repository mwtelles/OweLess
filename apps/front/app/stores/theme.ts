import { defineStore } from 'pinia'

type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', {
    state: () => ({
        mode: (localStorage.getItem('theme') as ThemeMode) || getDefaultTheme()
    }),
    actions: {
        toggleTheme() {
            this.mode = this.mode === 'light' ? 'dark' : 'light'
            this.applyTheme()
        },
        setTheme(mode: ThemeMode) {
            this.mode = mode
            this.applyTheme()
        },
        applyTheme() {
            document.documentElement.classList.remove('light', 'dark')
            document.documentElement.classList.add(this.mode)
            localStorage.setItem('theme', this.mode)
        }
    }
})

function getDefaultTheme(): ThemeMode {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
    }
    return 'light'
}
