declare module 'jsqr' {
  export interface QrCode {
    data: string
    binaryData?: string
    location?: unknown
  }

  const jsQR: (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: {
      inversionAttempts?: 'dontInvert' | 'attemptBoth' | 'invertFirst' | 'onlyInvert'
    },
  ) => QrCode | null

  export default jsQR
}
