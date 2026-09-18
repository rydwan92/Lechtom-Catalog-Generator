const LEFT_ODD = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const LEFT_EVEN = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111']
const RIGHT = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100']
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL']

export function encodeEan13(value: string | null | undefined): { digits: string; bars: string } | null {
  const digits = value?.trim().replace(/[\s-]/g, '') ?? ''
  if (!/^\d{13}$/.test(digits)) return null

  const checksum = digits.slice(0, 12).split('').reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3), 0)
  if ((10 - checksum % 10) % 10 !== Number(digits[12])) return null

  const parity = PARITY[Number(digits[0])]
  const left = digits.slice(1, 7).split('').map((digit, index) => (parity[index] === 'L' ? LEFT_ODD : LEFT_EVEN)[Number(digit)]).join('')
  const right = digits.slice(7).split('').map((digit) => RIGHT[Number(digit)]).join('')
  return { digits, bars: `101${left}01010${right}101` }
}
