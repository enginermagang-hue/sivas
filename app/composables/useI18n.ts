export const useI18n = () => {
  const locale = useState<string>('app-locale', () => 'id')
  const locales: Record<string, Record<string, any>> = {
    id: {} as any,
    en: {} as any
  }

  async function loadLocale(loc: string) {
    if (locales[loc] && Object.keys(locales[loc]).length > 0) return
    const mod = await import(`./${loc}.json`)
    locales[loc] = mod.default || mod
  }

  async function setLocale(loc: string) {
    await loadLocale(loc)
    locale.value = loc
    if (process.client) {
      localStorage.setItem('app-locale', loc)
    }
  }

  async function init() {
    if (process.client) {
      const saved = localStorage.getItem('app-locale')
      if (saved && saved !== locale.value) {
        await setLocale(saved)
      }
    }
    await loadLocale(locale.value)
  }

  function t(key: string, fallback?: string): string {
    const dict = locales[locale.value] || {}
    const val = key.split('.').reduce<any>((acc, part) => (acc ? acc[part] : null), dict)
    if (val !== null && val !== undefined) return String(val)
    const enDict = locales['en'] || {}
    const enVal = key.split('.').reduce<any>((acc, part) => (acc ? acc[part] : null), enDict)
    if (enVal !== null && enVal !== undefined) return String(enVal)
    return fallback || key
  }

  return {
    locale,
    setLocale,
    init,
    t
  }
}
