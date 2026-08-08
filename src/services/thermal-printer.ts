import QRCode from 'qrcode'

export type ThermalPrintOptions = {
  value: string
  printerName?: string
  pageWidthMm?: number
  pageHeightMm?: number
}

const getQz = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Printing is only available in browser context.')
  }

  const mod = await import('qz-tray')
  return (mod.default || mod) as any
}

const ensureConnected = async () => {
  const qz = await getQz()
  await qz.websocket.connect()
  return qz
}

const ensurePrinter = async (qz: any, printerName?: string) => {
  await qz.websocket.connect()

  if (printerName) {
    const found = await qz.printers.find(printerName)
    if (!found?.length) throw new Error(`Printer "${printerName}" tidak ditemukan.`)
    return found[0]
  }

  const list = await (qz.printers.getPrinters ? qz.printers.getPrinters() : qz.printers.find())
  if (!list?.length) throw new Error('Tidak ada printer terdeteksi dari QZ Tray.')
  return list[0].name || list[0]
}

const buildEscPosHtml = (
  qrDataUrl: string,
  qrValue: string,
  pageWidthMm = 101.6,
  pageHeightMm = 76.2,
) => `
  <div style="width:${pageWidthMm}mm;height:${pageHeightMm}mm;padding:4mm; text-align:center; font-family:Arial, sans-serif; font-size:14px; display:flex; flex-direction:column; justify-content:flex-start; align-items:center; box-sizing:border-box; overflow:hidden;">
    <div style="width:100%; text-align:center; padding-top:1mm;">
    <img src="${qrDataUrl}" alt="QR Code" />
    <div style="margin-top:4mm; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; font-size:12px;">
      ${qrValue}
    </div>
  </div>
`

export const getAvailablePrinters = async (): Promise<string[]> => {
  const qz = await ensureConnected()
  const list = await (qz.printers.getPrinters ? qz.printers.getPrinters() : qz.printers.find())
  return list?.map((item: any) => item.name || item) ?? []
}

export const isQzReady = async (): Promise<boolean> => {
  try {
    await ensureConnected()
    return true
  } catch {
    return false
  }
}

export const printQrLabel = async (params: ThermalPrintOptions): Promise<string> => {
  const qz = await ensureConnected()
  const chosenPrinter = await ensurePrinter(qz, params.printerName)
  const config = qz.configs.create(chosenPrinter)

  const qrDataUrl = await QRCode.toDataURL(params.value, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 280,
  })

  await qz.print(config, [
    {
      type: 'html',
      format: 'plain',
      data: buildEscPosHtml(qrDataUrl, params.value, params.pageWidthMm, params.pageHeightMm),
    },
  ])

  return `QR berhasil dikirim ke printer ${typeof chosenPrinter === 'string' ? chosenPrinter : chosenPrinter?.name || ''}`
}

export const disconnectPrinterHost = async (): Promise<void> => {
  const qz = await ensureConnected()
  await qz.websocket.disconnect()
}
