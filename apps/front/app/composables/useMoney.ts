import { useSettingsStore } from '~/stores/settings'

export function useMoney() {
    const settings = useSettingsStore()
    const formatMoney = (value: number | string | null | undefined) => {
        const n = typeof value === 'number' ? value : Number(value ?? 0)
        return new Intl.NumberFormat(settings.locale, { style: 'currency', currency: settings.currency }).format(n)
    }
    return { formatMoney }
}
