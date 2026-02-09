import { describe, it, expect, beforeEach } from 'vitest';
import { MaterialBank } from '@engine/professions/material-bank';
import { MaterialTier, ProfessionId } from '@shared/types/enums';
import type { IMaterial, IMaterialBankEntry } from '@shared/types/profession';

/** Helper to build a material definition for tests */
function makeMaterial(overrides: Partial<IMaterial> = {}): IMaterial {
  return {
    id: 'mat_mining_t1_copper_ore',
    name: 'Copper Ore',
    tier: MaterialTier.T1,
    stackSize: 200,
    vendorPrice: 1,
    source: 'gathering',
    gatheringProfession: ProfessionId.Mining,
    ...overrides,
  };
}

/** Build a material registry (id -> IMaterial) for tests */
function makeRegistry(materials: IMaterial[]): Map<string, IMaterial> {
  const map = new Map<string, IMaterial>();
  for (const mat of materials) {
    map.set(mat.id, mat);
  }
  return map;
}

describe('MaterialBank', () => {
  const copperOre = makeMaterial();
  const ironOre = makeMaterial({
    id: 'mat_mining_t2_iron_ore',
    name: 'Iron Ore',
    tier: MaterialTier.T2,
    stackSize: 200,
  });
  const peacebloom = makeMaterial({
    id: 'mat_herbalism_t1_peacebloom',
    name: 'Peacebloom',
    tier: MaterialTier.T1,
    stackSize: 200,
    gatheringProfession: ProfessionId.Herbalism,
  });
  const smallStack = makeMaterial({
    id: 'mat_test_small_stack',
    name: 'Small Stack Mat',
    tier: MaterialTier.T1,
    stackSize: 5,
  });

  const registry = makeRegistry([copperOre, ironOre, peacebloom, smallStack]);
  let bank: MaterialBank;

  beforeEach(() => {
    bank = new MaterialBank(registry, 100);
  });

  describe('addMaterial', () => {
    it('should create a new entry for an unknown material', () => {
      const added = bank.add(copperOre.id, 10);
      expect(added).toBe(10);
      expect(bank.getQuantity(copperOre.id)).toBe(10);
    });

    it('should add to existing stack', () => {
      bank.add(copperOre.id, 10);
      const added = bank.add(copperOre.id, 5);
      expect(added).toBe(5);
      expect(bank.getQuantity(copperOre.id)).toBe(15);
    });

    it('should clamp to stackSize limit', () => {
      const added = bank.add(smallStack.id, 8);
      expect(added).toBe(5);
      expect(bank.getQuantity(smallStack.id)).toBe(5);
    });

    it('should add partial amount when existing + requested exceeds stackSize', () => {
      bank.add(smallStack.id, 3);
      const added = bank.add(smallStack.id, 4);
      expect(added).toBe(2); // only 2 more fit (3 + 2 = 5)
      expect(bank.getQuantity(smallStack.id)).toBe(5);
    });

    it('should return 0 when stack is already full', () => {
      bank.add(smallStack.id, 5);
      const added = bank.add(smallStack.id, 1);
      expect(added).toBe(0);
      expect(bank.getQuantity(smallStack.id)).toBe(5);
    });

    it('should reject adding a material not in the registry', () => {
      const added = bank.add('mat_unknown_xyz', 10);
      expect(added).toBe(0);
    });

    it('should reject adding zero or negative quantity', () => {
      expect(bank.add(copperOre.id, 0)).toBe(0);
      expect(bank.add(copperOre.id, -5)).toBe(0);
    });
  });

  describe('bank capacity limit', () => {
    it('should respect maximum unique material slots', () => {
      // Create a bank with capacity of 3 unique materials
      const tinyBank = new MaterialBank(registry, 3);
      tinyBank.add(copperOre.id, 1);
      tinyBank.add(ironOre.id, 1);
      tinyBank.add(peacebloom.id, 1);

      // 4th unique material should be rejected
      const added = tinyBank.add(smallStack.id, 1);
      expect(added).toBe(0);
      expect(tinyBank.getQuantity(smallStack.id)).toBe(0);
    });

    it('should allow adding to existing material even when at capacity', () => {
      const tinyBank = new MaterialBank(registry, 2);
      tinyBank.add(copperOre.id, 5);
      tinyBank.add(ironOre.id, 5);

      // Bank is full (2 unique), but adding to existing should work
      const added = tinyBank.add(copperOre.id, 3);
      expect(added).toBe(3);
      expect(tinyBank.getQuantity(copperOre.id)).toBe(8);
    });

    it('should default to 100 unique material slots', () => {
      const defaultBank = new MaterialBank(registry);
      expect(defaultBank.capacity).toBe(100);
    });
  });

  describe('removeMaterial', () => {
    it('should decrement quantity', () => {
      bank.add(copperOre.id, 20);
      const result = bank.remove(copperOre.id, 5);
      expect(result).toBe(true);
      expect(bank.getQuantity(copperOre.id)).toBe(15);
    });

    it('should remove entry when quantity reaches zero', () => {
      bank.add(copperOre.id, 5);
      const result = bank.remove(copperOre.id, 5);
      expect(result).toBe(true);
      expect(bank.getQuantity(copperOre.id)).toBe(0);
      expect(bank.uniqueCount).toBe(0);
    });

    it('should return false if insufficient quantity', () => {
      bank.add(copperOre.id, 3);
      const result = bank.remove(copperOre.id, 5);
      expect(result).toBe(false);
      // Quantity should be unchanged
      expect(bank.getQuantity(copperOre.id)).toBe(3);
    });

    it('should return false for unknown material', () => {
      const result = bank.remove('mat_unknown_xyz', 1);
      expect(result).toBe(false);
    });

    it('should return false for zero or negative quantity', () => {
      bank.add(copperOre.id, 10);
      expect(bank.remove(copperOre.id, 0)).toBe(false);
      expect(bank.remove(copperOre.id, -1)).toBe(false);
    });
  });

  describe('hasMaterials', () => {
    it('should return true when all required materials are available', () => {
      bank.add(copperOre.id, 10);
      bank.add(ironOre.id, 5);
      const result = bank.hasMaterials([
        { materialId: copperOre.id, quantity: 5 },
        { materialId: ironOre.id, quantity: 3 },
      ]);
      expect(result).toBe(true);
    });

    it('should return false when a required material is missing', () => {
      bank.add(copperOre.id, 10);
      const result = bank.hasMaterials([
        { materialId: copperOre.id, quantity: 5 },
        { materialId: ironOre.id, quantity: 3 },
      ]);
      expect(result).toBe(false);
    });

    it('should return false when a required material has insufficient quantity', () => {
      bank.add(copperOre.id, 2);
      const result = bank.hasMaterials([
        { materialId: copperOre.id, quantity: 5 },
      ]);
      expect(result).toBe(false);
    });

    it('should return true for empty requirements list', () => {
      expect(bank.hasMaterials([])).toBe(true);
    });
  });

  describe('getQuantity', () => {
    it('should return 0 for unknown materials', () => {
      expect(bank.getQuantity('mat_nonexistent')).toBe(0);
    });

    it('should return correct quantity for known materials', () => {
      bank.add(copperOre.id, 42);
      expect(bank.getQuantity(copperOre.id)).toBe(42);
    });
  });

  describe('getAll', () => {
    it('should return all stored materials', () => {
      bank.add(copperOre.id, 10);
      bank.add(ironOre.id, 5);
      const all = bank.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual({ materialId: copperOre.id, quantity: 10 });
      expect(all).toContainEqual({ materialId: ironOre.id, quantity: 5 });
    });

    it('should return empty array for empty bank', () => {
      expect(bank.getAll()).toHaveLength(0);
    });
  });

  describe('serialize / deserialize', () => {
    it('should round-trip through serialize and deserialize', () => {
      bank.add(copperOre.id, 50);
      bank.add(ironOre.id, 25);
      bank.add(peacebloom.id, 10);

      const serialized: IMaterialBankEntry[] = bank.serialize();
      expect(serialized).toHaveLength(3);

      // Create a new bank and deserialize into it
      const newBank = new MaterialBank(registry, 100);
      newBank.deserialize(serialized);

      expect(newBank.getQuantity(copperOre.id)).toBe(50);
      expect(newBank.getQuantity(ironOre.id)).toBe(25);
      expect(newBank.getQuantity(peacebloom.id)).toBe(10);
      expect(newBank.uniqueCount).toBe(3);
    });

    it('should clear existing data on deserialize', () => {
      bank.add(copperOre.id, 100);
      bank.deserialize([{ materialId: ironOre.id, quantity: 5 }]);

      expect(bank.getQuantity(copperOre.id)).toBe(0);
      expect(bank.getQuantity(ironOre.id)).toBe(5);
      expect(bank.uniqueCount).toBe(1);
    });

    it('should skip entries with invalid material IDs during deserialize', () => {
      bank.deserialize([
        { materialId: copperOre.id, quantity: 10 },
        { materialId: 'mat_invalid_xxx', quantity: 99 },
      ]);
      expect(bank.getQuantity(copperOre.id)).toBe(10);
      expect(bank.getQuantity('mat_invalid_xxx')).toBe(0);
      expect(bank.uniqueCount).toBe(1);
    });

    it('should clamp deserialized quantities to stackSize', () => {
      bank.deserialize([{ materialId: smallStack.id, quantity: 999 }]);
      expect(bank.getQuantity(smallStack.id)).toBe(5);
    });
  });
});
