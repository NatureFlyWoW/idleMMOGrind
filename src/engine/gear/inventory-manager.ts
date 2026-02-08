import { PrimaryStat, GearSlot } from '@shared/types/enums';
import type { IItem } from '@shared/types/item';

const STAT_WEIGHTS: Record<PrimaryStat, Record<PrimaryStat, number>> = {
  [PrimaryStat.Strength]: { [PrimaryStat.Strength]: 1.0, [PrimaryStat.Agility]: 0.3, [PrimaryStat.Intellect]: 0.0, [PrimaryStat.Spirit]: 0.1, [PrimaryStat.Stamina]: 0.5 },
  [PrimaryStat.Agility]: { [PrimaryStat.Strength]: 0.3, [PrimaryStat.Agility]: 1.0, [PrimaryStat.Intellect]: 0.0, [PrimaryStat.Spirit]: 0.1, [PrimaryStat.Stamina]: 0.5 },
  [PrimaryStat.Intellect]: { [PrimaryStat.Strength]: 0.0, [PrimaryStat.Agility]: 0.1, [PrimaryStat.Intellect]: 1.0, [PrimaryStat.Spirit]: 0.6, [PrimaryStat.Stamina]: 0.4 },
  [PrimaryStat.Spirit]: { [PrimaryStat.Strength]: 0.0, [PrimaryStat.Agility]: 0.1, [PrimaryStat.Intellect]: 0.6, [PrimaryStat.Spirit]: 1.0, [PrimaryStat.Stamina]: 0.4 },
  [PrimaryStat.Stamina]: { [PrimaryStat.Strength]: 0.5, [PrimaryStat.Agility]: 0.3, [PrimaryStat.Intellect]: 0.3, [PrimaryStat.Spirit]: 0.3, [PrimaryStat.Stamina]: 1.0 },
};

export function getItemScore(item: IItem, classPrimaryStats: PrimaryStat[]): number {
  let score = 0;
  const mainStat = classPrimaryStats[0] ?? PrimaryStat.Strength;
  const weights = STAT_WEIGHTS[mainStat];

  for (const [stat, value] of Object.entries(item.primaryStats)) {
    const weight = weights[stat as PrimaryStat] ?? 0.1;
    score += (value ?? 0) * weight;
  }

  for (const [, value] of Object.entries(item.secondaryStats)) {
    score += value * 0.5;
  }

  return score;
}

export function isUpgrade(
  newItem: IItem,
  equippedItem: IItem | null,
  classPrimaryStats: PrimaryStat[],
): boolean {
  if (!equippedItem) return true;
  return getItemScore(newItem, classPrimaryStats) > getItemScore(equippedItem, classPrimaryStats);
}

export function equipItem(
  equipment: Partial<Record<GearSlot, IItem | null>>,
  inventory: (IItem | null)[],
  item: IItem,
): { equipment: Partial<Record<GearSlot, IItem | null>>; inventory: (IItem | null)[]; unequipped: IItem | null } {
  const slot = item.slot;
  const currentlyEquipped = equipment[slot] ?? null;

  const newEquipment = { ...equipment, [slot]: item };
  const newInventory = [...inventory];

  // Remove item from inventory
  const idx = newInventory.findIndex(i => i?.id === item.id);
  if (idx >= 0) {
    newInventory[idx] = null;
  }

  // Put old item in inventory if there was one
  if (currentlyEquipped) {
    const emptySlot = newInventory.findIndex(i => i === null);
    if (emptySlot >= 0) {
      newInventory[emptySlot] = currentlyEquipped;
    }
    // If no empty slot, old item is lost (edge case)
  }

  return { equipment: newEquipment, inventory: newInventory, unequipped: currentlyEquipped };
}

export function unequipItem(
  equipment: Partial<Record<GearSlot, IItem | null>>,
  inventory: (IItem | null)[],
  slot: GearSlot,
): { equipment: Partial<Record<GearSlot, IItem | null>>; inventory: (IItem | null)[]; success: boolean } {
  const item = equipment[slot];
  if (!item) return { equipment, inventory, success: false };

  const emptySlot = inventory.findIndex(i => i === null);
  if (emptySlot < 0) return { equipment, inventory, success: false };

  const newEquipment = { ...equipment, [slot]: null };
  const newInventory = [...inventory];
  newInventory[emptySlot] = item;

  return { equipment: newEquipment, inventory: newInventory, success: true };
}

export function addToInventory(
  inventory: (IItem | null)[],
  item: IItem,
): { success: boolean; inventory: (IItem | null)[] } {
  const emptySlot = inventory.findIndex(i => i === null);
  if (emptySlot < 0) return { success: false, inventory };

  const newInventory = [...inventory];
  newInventory[emptySlot] = item;
  return { success: true, inventory: newInventory };
}
