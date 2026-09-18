// The supplied workspace has no definitions for B2B.GetGoods or B2B.GetGoodsByGroup.
// Manufacturer linkage must be added only after inspecting those definitions.
export class ErpManufacturerRepository { async list(): Promise<string[]> { return [] } }
