import { describe, it, expect } from 'vitest';
import { equipItem, unequipItem, isUpgrade, addToInventory } from '@engine/gear/inventory-manager';
import { GearSlot, ItemQuality, PrimaryStat } from '@shared/types/enums';
import type { IItem } from '@shared/types/item';

function makeItem(overrides: Partial<IItem> = {}): IItem {
  return {
    id: crypto.randomUUID(),
    templateId: 'test',
    name: 'Test Item',
    slot: GearSlot.Chest,
    quality: ItemQuality.Common,
    iLevel: 10,
    requiredLevel: 7,
    primaryStats: { [PrimaryStat.Strength]: 10 },
    secondaryStats: {},
    durability: { current: 100, max: 100 },
    sellValue: 5,
    ...overrides,
  };
}

describe('isUpgrade', () => {
  it('should return true when slot is empty', () => {
    const newItem = makeItem();
    expect(isUpgrade(newItem, null, [PrimaryStat.Strength])).toBe(true);
  });

  it('should return true when new item has higher iLevel', () => {
    const equipped = makeItem({ iLevel: 10 });
    const newItem = makeItem({ iLevel: 20, primaryStats: { [PrimaryStat.Strength]: 20 } });
    expect(isUpgrade(newItem, equipped, [PrimaryStat.Strength])).toBe(true);
  });

  it('should return false when equipped item is better', () => {
    const equipped = makeItem({ iLevel: 30, primaryStats: { [PrimaryStat.Strength]: 30 } });
    const newItem = makeItem({ iLevel: 10 });
    expect(isUpgrade(newItem, equipped, [PrimaryStat.Strength])).toBe(false);
  });
});

describe('addToInventory', () => {
  it('should add item to first empty slot', () => {
    const inventory: (IItem | null)[] = new Array(28).fill(null) as (IItem | null)[];
    const item = makeItem();
    const result = addToInventory(inventory, item);
    expect(result.success).toBe(true);
    expect(result.inventory[0]).toBe(item);
  });

  it('should fail when inventory is full', () => {
    const inventory: (IItem | null)[] = new Array(28).fill(null).map(() => makeItem()) as (IItem | null)[];
    const item = makeItem();
    const result = addToInventory(inventory, item);
    expect(result.success).toBe(false);
  });
});

describe('equipItem', () => {
  it('should equip item and remove from inventory', () => {
    const item = makeItem({ slot: GearSlot.Chest });
    const inventory: (IItem | null)[] = [item, ...new Array(27).fill(null) as null[]];
    const equipment: Partial<Record<GearSlot, IItem | null>> = {};

    const result = equipItem(equipment, inventory, item);
    expect(result.equipment[GearSlot.Chest]).toBe(item);
    expect(result.inventory[0]).toBeNull();
    expect(result.unequipped).toBeNull();
  });

  it('should swap equipped item into inventory', () => {
    const oldItem = makeItem({ slot: GearSlot.Chest, name: 'Old' });
    const newItem = makeItem({ slot: GearSlot.Chest, name: 'New' });
    const inventory: (IItem | null)[] = [newItem, ...new Array(27).fill(null) as null[]];
    const equipment: Partial<Record<GearSlot, IItem | null>> = { [GearSlot.Chest]: oldItem };

    const result = equipItem(equipment, inventory, newItem);
    expect(result.equipment[GearSlot.Chest]).toBe(newItem);
    expect(result.unequipped).toBe(oldItem);
    // Old item should be in inventory where new item was
    expect(result.inventory[0]).toBe(oldItem);
  });
});

describe('unequipItem', () => {
  it('should move equipped item to inventory', () => {
    const item = makeItem({ slot: GearSlot.Head });
    const equipment: Partial<Record<GearSlot, IItem | null>> = { [GearSlot.Head]: item };
    const inventory: (IItem | null)[] = new Array(28).fill(null) as (IItem | null)[];

    const result = unequipItem(equipment, inventory, GearSlot.Head);
    expect(result.success).toBe(true);
    expect(result.equipment[GearSlot.Head]).toBeNull();
    expect(result.inventory[0]).toBe(item);
  });

  it('should fail when nothing is equipped in slot', () => {
    const equipment: Partial<Record<GearSlot, IItem | null>> = {};
    const inventory: (IItem | null)[] = new Array(28).fill(null) as (IItem | null)[];

    const result = unequipItem(equipment, inventory, GearSlot.Head);
    expect(result.success).toBe(false);
  });

  it('should fail when inventory is full', () => {
    const item = makeItem({ slot: GearSlot.Head });
    const equipment: Partial<Record<GearSlot, IItem | null>> = { [GearSlot.Head]: item };
    const inventory: (IItem | null)[] = new Array(28).fill(null).map(() => makeItem()) as (IItem | null)[];

    const result = unequipItem(equipment, inventory, GearSlot.Head);
    expect(result.success).toBe(false);
  });
});
