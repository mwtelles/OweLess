import enUS from '~/locales/en-US'
import ptBR from '~/locales/pt-BR'
import { useSettingsStore } from '~/stores/settings'

const dictionaries: Record<string, any> = {
    'en-US': enUS,
    'pt-BR': ptBR
}

function get(obj: any, path: string, fallback?: string) {
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? fallback ?? path
}

export default defineNuxtPlugin(() => {
    return {
        provide: {
            t: (key: string, fallback?: string) => {
                const settings = useSettingsStore()
                const dict = dictionaries[settings.locale] || enUS
                return get(dict, key, fallback)
            }
        }
    }
})
