import { useSettingsStore } from '~/stores/settings'

export default defineNuxtPlugin(() => {
    const settings = useSettingsStore()
    const headers = useRequestHeaders()
    const acceptLanguage = headers['accept-language'] || ''

    if (!settings.locale) {
        if (acceptLanguage.toLowerCase().includes('pt')) {
            settings.locale = 'pt-BR'
        } else if (acceptLanguage.toLowerCase().includes('en')) {
            settings.locale = 'en-US'
        } else {
            settings.locale = 'en-US'
        }
    }
})
