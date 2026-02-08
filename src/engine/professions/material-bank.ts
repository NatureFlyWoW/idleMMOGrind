import type { IMaterial, IMaterialBankEntry, IRecipeMaterial } from '@shared/types/profession';

/**
 * In-memory material storage for the profession system.
 *
 * Backed by a Map<materialId, quantity>. Enforces per-material stack size
 * limits from material definitions and a global unique-material capacity.
 *
 * This is a standalone class, not an IGameSystem. Owned by ProfessionManager.
 */
export class MaterialBank {
  /** materialId -> current quantity */
  private readonly store = new Map<string, number>();

  /** Material definitions registry: materialId -> IMaterial */
  private readonly registry: Map<string, IMaterial>;

  /** Maximum number of unique materials the bank can hold */
  public readonly capacity: number;

  constructor(registry: Map<string, IMaterial>, capacity = 100) {
    this.registry = registry;
    this.capacity = capacity;
  }

  /** Number of unique materials currently stored */
  get uniqueCount(): number {
    return this.store.size;
  }

  /**
   * Add materials to the bank.
   * Returns the number of items actually added (may be less than requested
   * due to stack size limits, capacity limits, or invalid input).
   */
  add(materialId: string, quantity: number): number {
    if (quantity <= 0) return 0;

    const definition = this.registry.get(materialId);
    if (!definition) return 0;

    const current = this.store.get(materialId) ?? 0;

    // If this is a new unique material, check capacity
    if (current === 0 && this.store.size >= this.capacity) {
      return 0;
    }

    const maxAdd = definition.stackSize - current;
    if (maxAdd <= 0) return 0;

    const actualAdd = Math.min(quantity, maxAdd);
    const newTotal = current + actualAdd;

    if (newTotal > 0) {
      this.store.set(materialId, newTotal);
    }

    return actualAdd;
  }

  /**
   * Remove materials from the bank.
   * Returns true if the full quantity was removed, false if insufficient
   * (in which case no materials are removed -- atomic operation).
   */
  remove(materialId: string, quantity: number): boolean {
    if (quantity <= 0) return false;

    const current = this.store.get(materialId);
    if (current === undefined || current < quantity) return false;

    const newTotal = current - quantity;
    if (newTotal === 0) {
      this.store.delete(materialId);
    } else {
      this.store.set(materialId, newTotal);
    }

    return true;
  }

  /**
   * Check if all recipe material requirements are satisfied.
   */
  hasMaterials(requirements: IRecipeMaterial[]): boolean {
    for (const req of requirements) {
      if (this.getQuantity(req.materialId) < req.quantity) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get the current quantity of a specific material.
   * Returns 0 for unknown / unstored materials.
   */
  getQuantity(materialId: string): number {
    return this.store.get(materialId) ?? 0;
  }

  /**
   * Get all stored materials as an array of bank entries.
   */
  getAll(): IMaterialBankEntry[] {
    const entries: IMaterialBankEntry[] = [];
    for (const [materialId, quantity] of this.store) {
      entries.push({ materialId, quantity });
    }
    return entries;
  }

  /**
   * Serialize the bank contents for save data.
   */
  serialize(): IMaterialBankEntry[] {
    return this.getAll();
  }

  /**
   * Deserialize saved bank data, replacing all current contents.
   * Invalid material IDs are silently skipped. Quantities are clamped
   * to the material's stackSize.
   */
  deserialize(entries: IMaterialBankEntry[]): void {
    this.store.clear();
    for (const entry of entries) {
      const definition = this.registry.get(entry.materialId);
      if (!definition) continue;

      const clampedQty = Math.min(entry.quantity, definition.stackSize);
      if (clampedQty > 0) {
        this.store.set(entry.materialId, clampedQty);
      }
    }
  }
}
