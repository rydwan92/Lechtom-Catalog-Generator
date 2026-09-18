import { encodeEan13 } from './ean13'

export function Ean13Barcode({ ean, tall = false }: { ean: string | null | undefined; tall?: boolean }) {
  const encoded = encodeEan13(ean)
  if (!encoded) return ean?.trim() ? <span className="product-ean">EAN: {ean}</span> : null

  const bars: { start: number; width: number; guard: boolean }[] = []
  for (let index = 0; index < encoded.bars.length;) {
    if (encoded.bars[index] === '0') { index += 1; continue }
    const start = index
    const guard = index < 3 || (index >= 45 && index < 50) || index >= 92
    while (index < encoded.bars.length && encoded.bars[index] === '1' && (index < 3 || (index >= 45 && index < 50) || index >= 92) === guard) index += 1
    bars.push({ start, width: index - start, guard })
  }
  const textBaseline = tall ? 93 : 54
  const regularBarHeight = tall ? 70 : 41
  const guardBarHeight = tall ? 78 : 45

  return <svg className="ean13-barcode" viewBox={tall ? '0 0 113 95' : '0 0 113 56'} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Kod kreskowy EAN-13: ${encoded.digits}`}>
    <title>{`EAN-13 ${encoded.digits}`}</title>
    <rect width="113" height={tall ? 95 : 56} fill="#fff"/>
    <g fill="#000" shapeRendering="crispEdges">
      {bars.map(({ start, width, guard }) => <rect key={start} x={11 + start} y="1" width={width} height={guard ? guardBarHeight : regularBarHeight}/>)}
    </g>
    <g fill="#000" fontFamily="Arial, sans-serif" fontSize="8.2" textAnchor="middle">
      <text x="5" y={textBaseline}>{encoded.digits[0]}</text>
      <text x="32" y={textBaseline} textLength="40" lengthAdjust="spacing">{encoded.digits.slice(1, 7)}</text>
      <text x="82" y={textBaseline} textLength="40" lengthAdjust="spacing">{encoded.digits.slice(7)}</text>
    </g>
  </svg>
}
