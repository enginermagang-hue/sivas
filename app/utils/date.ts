// ponytail: minimal helpers — cukup untuk parse UTC SQLite (YYYY-MM-DD HH:MM:SS) ke Date lokal browser.
// Upgrade: pakai date-fns/luxon jika butuh timezone named (Asia/Jakarta) eksplisit atau relative time i18n.

function parseDbTimestamp(value: string): Date {
  if (!value) return new Date(NaN)
  const s = String(value).trim()
  // SQLite UTC tanpa TZ: "YYYY-MM-DD HH:MM:SS" -> anggap UTC
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
    const iso = s.replace(' ', 'T')
    // sudah ada TZ?
    if (/[Zz]$/.test(iso) || /[+-]\d{2}:?\d{2}$/.test(iso)) return new Date(iso)
    return new Date(iso + 'Z')
  }
  // ISO dengan T tapi tanpa Z -> anggap UTC jika tanpa offset
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    if (/[Zz]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s)
    return new Date(s + 'Z')
  }
  return new Date(s)
}

function parseDbDateOnly(value: string): Date {
  if (!value) return new Date(NaN)
  const s = String(value).trim().slice(0, 10)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return parseDbTimestamp(s)
}

export function getLocalDateString(d = new Date()): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  const d = parseDbDateOnly(String(value))
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' })
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return '-'
  const d = parseDbDateOnly(String(value))
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const d = parseDbTimestamp(String(value))
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '-'
  const d = parseDbTimestamp(String(value))
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function parseDate(value: string): Date {
  // tanggal-only -> lokal, timestamp -> UTC->lokal
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())) return parseDbDateOnly(value)
  return parseDbTimestamp(value)
}
