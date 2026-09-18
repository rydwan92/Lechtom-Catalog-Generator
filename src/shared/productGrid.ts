export type ProductGridTemplate = 'PRODUCT_GRID_12' | 'PRODUCT_GRID_15_REFERENCE' | 'PRODUCT_GRID_16'

export function productGridCapacity(templateCode: string, pageType?: string): 12 | 15 | 16 {
  if (templateCode === 'PRODUCT_GRID_16' || pageType === 'PRODUCT_GRID_16') return 16
  if (templateCode === 'PRODUCT_GRID_15_REFERENCE') return 15
  return 12
}
