import React from 'react';
import { Panel } from '../shared/Panel';
import { ItemSlot } from './ItemSlot';
import styles from './InventoryGrid.module.css';
import type { IItem } from '@shared/types/item';
import { GearSlot } from '@shared/types/enums';

interface Props {
  equipment: Partial<Record<GearSlot, IItem | null>>;
  inventory: (IItem | null)[];
  onEquipItem?: (item: IItem) => void;
  onUnequipItem?: (slot: GearSlot) => void;
  onSellItem?: (item: IItem) => void;
}

const EQUIPMENT_LAYOUT: Array<{ slot: GearSlot; label: string }> = [
  { slot: GearSlot.Head, label: 'Head' },
  { slot: GearSlot.Neck, label: 'Neck' },
  { slot: GearSlot.Shoulders, label: 'Shoulders' },
  { slot: GearSlot.Back, label: 'Back' },
  { slot: GearSlot.Chest, label: 'Chest' },
  { slot: GearSlot.Wrists, label: 'Wrists' },
  { slot: GearSlot.Hands, label: 'Hands' },
  { slot: GearSlot.Waist, label: 'Waist' },
  { slot: GearSlot.Legs, label: 'Legs' },
  { slot: GearSlot.Feet, label: 'Feet' },
  { slot: GearSlot.Ring1, label: 'Ring' },
  { slot: GearSlot.Ring2, label: 'Ring' },
  { slot: GearSlot.Trinket1, label: 'Trinket' },
  { slot: GearSlot.Trinket2, label: 'Trinket' },
  { slot: GearSlot.MainHand, label: 'Main Hand' },
  { slot: GearSlot.OffHand, label: 'Off Hand' },
];

export const InventoryGrid: React.FC<Props> = ({
  equipment,
  inventory,
  onEquipItem,
  onUnequipItem,
  onSellItem,
}) => {
  const handleUnequip = (slot: GearSlot) => {
    const equippedItem = equipment[slot];
    if (equippedItem) {
      onUnequipItem?.(slot);
    }
  };

  return (
    <div className={styles.container}>
      <Panel variant="secondary" className={styles.equipmentPanel}>
        <h3 className={styles.title}>Equipment</h3>
        <div className={styles.equipGrid} role="group" aria-label="Equipment slots">
          {EQUIPMENT_LAYOUT.map(({ slot, label }) => (
            <ItemSlot
              key={slot}
              item={equipment[slot] ?? null}
              slotLabel={label}
              onRightClick={() => handleUnequip(slot)}
            />
          ))}
        </div>
      </Panel>

      <Panel variant="secondary" className={styles.bagPanel}>
        <h3 className={styles.title}>
          Bag ({inventory.filter(i => i !== null).length} / {inventory.length})
        </h3>
        <div className={styles.bagGrid} role="group" aria-label="Inventory bag">
          {inventory.map((item, idx) => (
            <ItemSlot
              key={idx}
              item={item}
              onClick={(i) => onEquipItem?.(i)}
              onRightClick={(i) => onSellItem?.(i)}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
};
