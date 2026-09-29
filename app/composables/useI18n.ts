export const useI18n = () => {
  const locale = useState<string>('app-locale', () => 'id')

  const id = {} as any
  const en = {} as any

  async function loadLocale(loc: string) {
    if (loc === 'id' && Object.keys(id).length > 0) return
    if (loc === 'en' && Object.keys(en).length > 0) return

    const idMod = await import('../locales/id.json')
    const enMod = await import('../locales/en.json')

    Object.assign(id, idMod.default || idMod)
    Object.assign(en, enMod.default || enMod)
  }

  async function setLocale(loc: string) {
    await loadLocale(loc)
    locale.value = loc
    if (process.client) {
      localStorage.setItem('app-locale', loc)
    }
  }

  async function init() {
    await loadLocale(locale.value)
    if (process.client) {
      const saved = localStorage.getItem('app-locale')
      if (saved && saved !== locale.value) {
        await setLocale(saved)
      }
    }
  }

  function t(key: string, fallback?: string): string {
    const dict = locale.value === 'en' ? en : id
    const val = key.split('.').reduce<any>((acc, part) => (acc ? acc[part] : null), dict)
    if (val !== null && val !== undefined) return String(val)
    const fallbackDict = locale.value === 'id' ? en : id
    const fallbackVal = key.split('.').reduce<any>((acc, part) => (acc ? acc[part] : null), fallbackDict)
    if (fallbackVal !== null && fallbackVal !== undefined) return String(fallbackVal)
    return fallback || key
  }

  return {
    locale,
    setLocale,
    init,
    t
  }
}
