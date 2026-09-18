import { describe, expect, it } from 'vitest'
import { getPreviewPosition } from './previewPosition'

describe('product preview placement', () => {
  const popup = { width: 360, height: 430 }
  const viewport = { width: 1200, height: 800 }
  it('opens beside a thumbnail when there is room', () => {
    expect(getPreviewPosition({ left: 100, right: 150, top: 200, bottom: 250 }, viewport, popup)).toEqual({ left: 162, top: 200 })
  })
  it('flips and clamps at viewport edges', () => {
    expect(getPreviewPosition({ left: 1100, right: 1150, top: 760, bottom: 800 }, viewport, popup)).toEqual({ left: 728, top: 358 })
  })
})
