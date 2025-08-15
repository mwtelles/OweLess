import { useSettingsStore } from '~/stores/settings'

export default defineNuxtPlugin(() => {
    const settings = useSettingsStore()

    if (!settings.locale) {
        const browserLang = navigator.language || navigator.languages?.[0] || 'en-US'

        if (browserLang.startsWith('pt')) {
            settings.locale = 'pt-BR'
        } else if (browserLang.startsWith('en')) {
            settings.locale = 'en-US'
        } else {
            settings.locale = 'en-US'
        }
    }
})
