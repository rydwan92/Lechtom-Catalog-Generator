export interface PreviewPosition { left: number; top: number }

export function getPreviewPosition(anchor: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>, viewport: { width: number; height: number }, popup: { width: number; height: number }): PreviewPosition {
  const margin = 12
  const right = anchor.right + margin
  const left = anchor.left - popup.width - margin
  const preferredLeft = right + popup.width <= viewport.width - margin ? right : left >= margin ? left : anchor.left
  return {
    left: Math.max(margin, Math.min(preferredLeft, viewport.width - popup.width - margin)),
    top: Math.max(margin, Math.min(anchor.top, viewport.height - popup.height - margin))
  }
}
