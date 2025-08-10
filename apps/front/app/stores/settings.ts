import { defineStore } from 'pinia'

type CurrencyCode = 'USD' | 'BRL' | 'EUR'
type LocaleCode = 'en-US' | 'pt-BR'

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        locale: (process.client && (localStorage.getItem('locale') as LocaleCode)) || 'en-US' as LocaleCode,
        currency: (process.client && (localStorage.getItem('currency') as CurrencyCode)) || 'USD' as CurrencyCode
    }),
    actions: {
        setLocale(l: LocaleCode) {
            this.locale = l
            if (process.client) localStorage.setItem('locale', l)
        },
        setCurrency(c: CurrencyCode) {
            this.currency = c
            if (process.client) localStorage.setItem('currency', c)
        }
    }
})
