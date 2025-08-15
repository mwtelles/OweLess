import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        locale: '' as string
    }),
    actions: {
        setLocale(locale: string) {
            this.locale = locale
        }
    }
})
