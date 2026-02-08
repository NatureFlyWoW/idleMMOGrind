# Phase 1 Implementation Plan — Gear System (Tasks 10-11)

> Part of the [Phase 1 Implementation Plan](phase1-index.md) | **Status:** Pending

---

## Task 10 -- Gear System (Item Generation, Equip Logic, Inventory)

**Worktree:** `feat/gear-system`
**Branch:** `feat/gear-system`
**Depends on:** Tasks 3, 4, 6

### Step 10.1 -- Write item generator tests

**File: `tests/unit/engine/gear/item-generator.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { generateItem } from '@engine/gear/item-generator';
import { GearSlot, ItemQuality, PrimaryStat } from '@shared/types/enums';
import { SeededRandom } from '@shared/utils/rng';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('generateItem', () => {
  it('should generate an item with correct iLevel and quality', () => {
    const rng = new SeededRandom(42);
    const item = generateItem({
      iLevel: 30,
      quality: ItemQuality.Rare,
      slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength, PrimaryStat.Stamina],
      rng,
      config,
    });
    expect(item.iLevel).toBe(30);
    expect(item.quality).toBe(ItemQuality.Rare);
    expect(item.slot).toBe(GearSlot.Chest);
  });

  it('should assign primary stats based on class affinity', () => {
    const rng = new SeededRandom(42);
    const item = generateItem({
      iLevel: 30,
      quality: ItemQuality.Rare,
      slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength, PrimaryStat.Stamina],
      rng,
      config,
    });
    const totalPrimary = Object.values(item.primaryStats).reduce((a, b) => a + (b ?? 0), 0);
    expect(totalPrimary).toBeGreaterThan(0);
  });

  it('should generate weapons with damage range', () => {
    const rng = new SeededRandom(42);
    const weapon = generateItem({
      iLevel: 30,
      quality: ItemQuality.Uncommon,
      slot: GearSlot.MainHand,
      classPrimaryStats: [PrimaryStat.Strength],
      weaponSpeed: 2.0,
      rng,
      config,
    });
    expect(weapon.weaponDamage).toBeDefined();
    expect(weapon.weaponDamage!.min).toBeGreaterThan(0);
    expect(weapon.weaponDamage!.max).toBeGreaterThan(weapon.weaponDamage!.min);
  });

  it('should calculate required level as max(1, iLevel - 3)', () => {
    const rng = new SeededRandom(42);
    const item = generateItem({
      iLevel: 30,
      quality: ItemQuality.Common,
      slot: GearSlot.Head,
      classPrimaryStats: [PrimaryStat.Intellect],
      rng,
      config,
    });
    expect(item.requiredLevel).toBe(27);
  });

  it('should not drop below required level 1', () => {
    const rng = new SeededRandom(42);
    const item = generateItem({
      iLevel: 1,
      quality: ItemQuality.Common,
      slot: GearSlot.Head,
      classPrimaryStats: [PrimaryStat.Intellect],
      rng,
      config,
    });
    expect(item.requiredLevel).toBe(1);
  });

  it('should scale stat budget with quality multiplier', () => {
    const rng1 = new SeededRandom(42);
    const common = generateItem({
      iLevel: 30, quality: ItemQuality.Common, slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength], rng: rng1, config,
    });
    const rng2 = new SeededRandom(42);
    const epic = generateItem({
      iLevel: 30, quality: ItemQuality.Epic, slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength], rng: rng2, config,
    });
    const commonTotal = Object.values(common.primaryStats).reduce((a, b) => a + (b ?? 0), 0)
      + Object.values(common.secondaryStats).reduce((a, b) => a + b, 0);
    const epicTotal = Object.values(epic.primaryStats).reduce((a, b) => a + (b ?? 0), 0)
      + Object.values(epic.secondaryStats).reduce((a, b) => a + b, 0);
    expect(epicTotal).toBeGreaterThan(commonTotal);
  });
});
```

### Step 10.2 -- Implement item generator

**File: `src/engine/gear/item-generator.ts`**

```typescript
import { GearSlot, ItemQuality, PrimaryStat, SecondaryStat } from '@shared/types/enums';
import type { IItem } from '@shared/types/item';
import { SLOT_BUDGET_WEIGHT, QUALITY_STAT_MULTIPLIER } from '@shared/types/item';
import type { IBalanceConfig } from '@shared/types/balance';
import { calculateStatBudget, calculateWeaponMinDamage, calculateWeaponMaxDamage } from '@engine/character/stat-calculator';
import type { SeededRandom } from '@shared/utils/rng';

const NAME_PREFIXES: Record<ItemQuality, string[]> = {
  [ItemQuality.Common]: ['Worn', 'Simple', 'Plain', 'Crude'],
  [ItemQuality.Uncommon]: ['Sturdy', 'Reinforced', 'Fine', 'Solid'],
  [ItemQuality.Rare]: ['Masterwork', 'Enchanted', 'Superior', 'Tempered'],
  [ItemQuality.Epic]: ['Ancient', 'Legendary', 'Mythic', 'Exalted'],
  [ItemQuality.Legendary]: ['Godforged', 'Eternal', 'Celestial', 'Divine'],
};

const SLOT_NAMES: Record<GearSlot, string> = {
  [GearSlot.Head]: 'Helm',
  [GearSlot.Shoulders]: 'Pauldrons',
  [GearSlot.Chest]: 'Chestpiece',
  [GearSlot.Wrists]: 'Bracers',
  [GearSlot.Hands]: 'Gauntlets',
  [GearSlot.Waist]: 'Belt',
  [GearSlot.Legs]: 'Leggings',
  [GearSlot.Feet]: 'Boots',
  [GearSlot.Neck]: 'Amulet',
  [GearSlot.Back]: 'Cloak',
  [GearSlot.Ring1]: 'Ring',
  [GearSlot.Ring2]: 'Ring',
  [GearSlot.Trinket1]: 'Trinket',
  [GearSlot.Trinket2]: 'Trinket',
  [GearSlot.MainHand]: 'Weapon',
  [GearSlot.OffHand]: 'Shield',
};

const SECONDARY_STAT_POOL = [
  SecondaryStat.CritChance,
  SecondaryStat.Haste,
  SecondaryStat.HitRating,
  SecondaryStat.Armor,
];

export interface IGenerateItemParams {
  iLevel: number;
  quality: ItemQuality;
  slot: GearSlot;
  classPrimaryStats: PrimaryStat[];
  weaponSpeed?: number;
  rng: SeededRandom;
  config: IBalanceConfig;
}

export function generateItem(params: IGenerateItemParams): IItem {
  const { iLevel, quality, slot, classPrimaryStats, rng, config } = params;

  // Calculate total stat budget
  const rawBudget = calculateStatBudget(iLevel, config);
  const qualityMult = QUALITY_STAT_MULTIPLIER[quality];
  const slotWeight = SLOT_BUDGET_WEIGHT[slot];
  const totalBudget = Math.floor(rawBudget * qualityMult * slotWeight);

  // Split budget: 70% primary, 30% secondary
  const primaryBudget = Math.floor(totalBudget * config.gear.primaryStatSplit);
  const secondaryBudget = totalBudget - primaryBudget;

  // Assign primary stats
  const primaryStats: Partial<Record<PrimaryStat, number>> = {};
  if (classPrimaryStats.length >= 2) {
    const mainStat = classPrimaryStats[0]!;
    const offStat = classPrimaryStats[1]!;
    primaryStats[mainStat] = Math.floor(primaryBudget * 0.6);
    primaryStats[offStat] = primaryBudget - Math.floor(primaryBudget * 0.6);
  } else if (classPrimaryStats.length === 1) {
    primaryStats[classPrimaryStats[0]!] = primaryBudget;
  }

  // Assign secondary stats (1-2 random from pool)
  const secondaryStats: Record<string, number> = {};
  const numSecondary = rng.nextInt(1, 2);
  const shuffled = [...SECONDARY_STAT_POOL].sort(() => rng.next() - 0.5);
  for (let i = 0; i < numSecondary && i < shuffled.length; i++) {
    const stat = shuffled[i]!;
    const share = i === 0 ? Math.ceil(secondaryBudget / numSecondary) : secondaryBudget - Math.ceil(secondaryBudget / numSecondary);
    if (share > 0) {
      secondaryStats[stat] = share;
    }
  }

  // Generate name
  const prefixes = NAME_PREFIXES[quality];
  const prefix = prefixes[rng.nextInt(0, prefixes.length - 1)]!;
  const slotName = SLOT_NAMES[slot];
  const name = `${prefix} ${slotName}`;

  // Weapon damage
  let weaponDamage: { min: number; max: number } | undefined;
  let weaponSpeed: number | undefined;
  if (slot === GearSlot.MainHand || slot === GearSlot.OffHand) {
    weaponSpeed = params.weaponSpeed ?? 2.0;
    const minDmg = calculateWeaponMinDamage(iLevel, qualityMult, weaponSpeed, config);
    const maxDmg = calculateWeaponMaxDamage(iLevel, qualityMult, weaponSpeed, config);
    weaponDamage = { min: Math.max(1, minDmg), max: Math.max(2, maxDmg) };
  }

  return {
    id: crypto.randomUUID(),
    templateId: `generated-${slot}-${iLevel}`,
    name,
    slot,
    quality,
    iLevel,
    requiredLevel: Math.max(1, iLevel - 3),
    primaryStats,
    secondaryStats,
    weaponDamage,
    weaponSpeed,
    durability: { current: 100, max: 100 },
    sellValue: Math.floor(iLevel * qualityMult * 2),
  };
}
```

**Run:** `pnpm test -- tests/unit/engine/gear/item-generator.test.ts` -- should PASS.

**Commit:** `feat(gear): add item generator with stat budgets, quality scaling, and weapon damage`

### Step 10.3 -- Write and implement inventory manager

**Test file: `tests/unit/engine/gear/inventory-manager.test.ts`**

```typescript
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
    const inventory: (IItem | null)[] = new Array(28).fill(null);
    const item = makeItem();
    const result = addToInventory(inventory, item);
    expect(result.success).toBe(true);
    expect(result.inventory[0]).toBe(item);
  });

  it('should fail when inventory is full', () => {
    const inventory: (IItem | null)[] = new Array(28).fill(null).map(() => makeItem());
    const item = makeItem();
    const result = addToInventory(inventory, item);
    expect(result.success).toBe(false);
  });
});
```

**Implementation file: `src/engine/gear/inventory-manager.ts`**

```typescript
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
  let newInventory = [...inventory];

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
```

**Run:** `pnpm test -- tests/unit/engine/gear/inventory-manager.test.ts` -- should PASS.

**Commit:** `feat(gear): add inventory manager with equip, unequip, and upgrade detection`

---

## Task 11 -- Loot System

**Worktree:** `feat/gear-system` (continues)
**Depends on:** Task 10

### Step 11.1 -- Write loot system tests

**File: `tests/unit/engine/gear/loot-system.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { rollLootDrop, rollItemQuality } from '@engine/gear/loot-system';
import { ItemQuality, PrimaryStat, GearSlot } from '@shared/types/enums';
import { SeededRandom } from '@shared/utils/rng';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('rollItemQuality', () => {
  it('should return a valid quality tier', () => {
    const rng = new SeededRandom(42);
    const quality = rollItemQuality(rng, 50, config);
    expect(Object.values(ItemQuality)).toContain(quality);
  });

  it('should not drop Epic quality below level 40', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const quality = rollItemQuality(rng, 30, config);
      expect(quality).not.toBe(ItemQuality.Epic);
    }
  });

  it('should mostly drop Common and Uncommon', () => {
    const rng = new SeededRandom(42);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 5000; i++) {
      const q = rollItemQuality(rng, 50, config);
      counts[q] = (counts[q] ?? 0) + 1;
    }
    expect(counts[ItemQuality.Common]! + counts[ItemQuality.Uncommon]!).toBeGreaterThan(3000);
  });
});

describe('rollLootDrop', () => {
  it('should sometimes return an item', () => {
    const rng = new SeededRandom(42);
    let drops = 0;
    for (let i = 0; i < 100; i++) {
      const item = rollLootDrop({
        monsterLevel: 20,
        playerLevel: 20,
        classPrimaryStats: [PrimaryStat.Strength, PrimaryStat.Stamina],
        rng,
        config,
      });
      if (item) drops++;
    }
    // With 20% drop chance, expect roughly 15-25 drops out of 100
    expect(drops).toBeGreaterThan(5);
    expect(drops).toBeLessThan(40);
  });

  it('should return null sometimes (no drop)', () => {
    const rng = new SeededRandom(1);
    let nulls = 0;
    for (let i = 0; i < 50; i++) {
      const item = rollLootDrop({
        monsterLevel: 10,
        playerLevel: 10,
        classPrimaryStats: [PrimaryStat.Agility],
        rng,
        config,
      });
      if (!item) nulls++;
    }
    expect(nulls).toBeGreaterThan(0);
  });
});
```

### Step 11.2 -- Implement loot system

**File: `src/engine/gear/loot-system.ts`**

```typescript
import { ItemQuality, GearSlot, PrimaryStat } from '@shared/types/enums';
import type { IItem } from '@shared/types/item';
import type { IBalanceConfig } from '@shared/types/balance';
import { generateItem } from './item-generator';
import type { SeededRandom } from '@shared/utils/rng';

const EQUIPPABLE_SLOTS: GearSlot[] = [
  GearSlot.Head, GearSlot.Shoulders, GearSlot.Chest, GearSlot.Wrists,
  GearSlot.Hands, GearSlot.Waist, GearSlot.Legs, GearSlot.Feet,
  GearSlot.Neck, GearSlot.Back, GearSlot.Ring1, GearSlot.Ring2,
  GearSlot.Trinket1, GearSlot.Trinket2, GearSlot.MainHand, GearSlot.OffHand,
];

export function rollItemQuality(
  rng: SeededRandom,
  playerLevel: number,
  config: IBalanceConfig,
): ItemQuality {
  const weights = { ...config.gear.qualityWeights };

  // No Epic below configured level, no Legendary in Phase 1
  if (playerLevel < config.gear.epicMinLevel) {
    weights[ItemQuality.Epic] = 0;
  }
  weights[ItemQuality.Legendary] = 0;

  const entries = Object.entries(weights)
    .filter(([, w]) => w > 0)
    .map(([q, w]) => ({ item: q as ItemQuality, weight: w }));

  return rng.weightedChoice(entries);
}

export interface IRollLootDropParams {
  monsterLevel: number;
  playerLevel: number;
  classPrimaryStats: PrimaryStat[];
  rng: SeededRandom;
  config: IBalanceConfig;
}

export function rollLootDrop(params: IRollLootDropParams): IItem | null {
  const { monsterLevel, playerLevel, classPrimaryStats, rng, config } = params;

  // Check if item drops at all
  if (!rng.chance(config.gear.dropChanceBase)) {
    return null;
  }

  const quality = rollItemQuality(rng, playerLevel, config);
  const slot = EQUIPPABLE_SLOTS[rng.nextInt(0, EQUIPPABLE_SLOTS.length - 1)]!;

  const qualityBonus: Record<ItemQuality, number> = {
    [ItemQuality.Common]: 0,
    [ItemQuality.Uncommon]: 1,
    [ItemQuality.Rare]: 2,
    [ItemQuality.Epic]: 4,
    [ItemQuality.Legendary]: 6,
  };

  const iLevel = monsterLevel + qualityBonus[quality];

  return generateItem({
    iLevel,
    quality,
    slot,
    classPrimaryStats,
    rng,
    config,
  });
}
```

**Run:** `pnpm test -- tests/unit/engine/gear/loot-system.test.ts` -- should PASS.

**Commit:** `feat(gear): add loot system with quality rolling and drop chance`

---

