import { getLocalDateString } from './date'

export interface PdfColumn {
  header: string
  dataKey: string
}

export interface PdfOpts {
  title?: string
  filterText?: string
  rows: Record<string, any>[]
  columns: PdfColumn[]
  filename?: string
}

async function buildDoc(opts: PdfOpts) {
  const { jsPDF } = await import('jspdf')
  const mod: any = await import('jspdf-autotable')
  const autoTable: any = mod.autoTable ?? mod.default ?? mod

  const title = opts.title ?? 'Laporan Aktivitas Harian'
  const filterText = opts.filterText?.trim() ? opts.filterText : 'Semua data — tanpa filter'
  const printedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
  const totalText = `${opts.rows.length} data`

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(title, pageW / 2, 14, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text(filterText, pageW / 2, 19, { align: 'center', maxWidth: pageW - 20 })
  doc.setFontSize(7)
  doc.text(`Dicetak: ${printedAt} \u2022 ${totalText}`, pageW / 2, 23, { align: 'center' })
  doc.setTextColor(0)

  const head = [opts.columns.map(c => c.header)]
  const body: string[][] = opts.rows.length
    ? opts.rows.map(r => opts.columns.map(c => String(r[c.dataKey] ?? '-')))
    : [['Tidak ada data untuk filter terpilih.', ...Array(Math.max(0, opts.columns.length - 1)).fill('')]]

  autoTable(doc, {
    startY: 27,
    head,
    body,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7, cellPadding: 2, overflow: 'linebreak', halign: 'left', valign: 'middle' },
    headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    columnStyles: opts.columns.reduce((acc: Record<number, any>, c, i) => {
      if (c.dataKey === 'no') acc[i] = { halign: 'center', cellWidth: 10 }
      if (c.dataKey === 'tanggal') acc[i] = { cellWidth: 26 }
      if (c.dataKey === 'jam_mulai' || c.dataKey === 'jam_selesai' || c.dataKey === 'mulai' || c.dataKey === 'selesai') acc[i] = { halign: 'center', cellWidth: 16 }
      if (c.dataKey === 'deskripsi') acc[i] = { cellWidth: 'auto' }
      return acc
    }, {}),
    margin: { top: 27, left: 8, right: 8, bottom: 10 },
    didDrawPage: (data: any) => {
      const pageCount = (doc as any).internal.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(130)
      doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, pageW - 8, doc.internal.pageSize.getHeight() - 4, { align: 'right' })
      doc.setTextColor(0)
    }
  })

  return doc
}

export async function downloadActivityPdf(opts: PdfOpts) {
  if (import.meta.server) return
  const doc: any = await buildDoc(opts)
  const filename = opts.filename ?? `laporan-aktivitas-${getLocalDateString()}.pdf`
  doc.save(filename)
}

export async function generateActivityPdfBlob(opts: PdfOpts): Promise<Blob> {
  const doc: any = await buildDoc(opts)
  return doc.output('blob') as Blob
}

export async function generateActivityPdfObjectUrl(opts: PdfOpts): Promise<string> {
  const blob = await generateActivityPdfBlob(opts)
  return URL.createObjectURL(blob)
}
