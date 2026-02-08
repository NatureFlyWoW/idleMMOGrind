import React, { useState } from 'react';
import { Panel } from '../shared/Panel';
import { Button } from '../shared/Button';
import styles from './SettingsTab.module.css';

type SaveSlot = 1 | 2 | 3;

interface Props {
  onSave?: (slot: SaveSlot) => void;
  onLoad?: (slot: SaveSlot) => void;
  onExport?: (slot: SaveSlot) => void;
  onDelete?: (slot: SaveSlot) => void;
}

export const SettingsTab: React.FC<Props> = ({ onSave, onLoad, onExport, onDelete }) => {
  const [autoEquip, setAutoEquip] = useState(true);
  const [autoSellCommon, setAutoSellCommon] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SaveSlot | null>(null);

  const SLOTS: SaveSlot[] = [1, 2, 3];

  return (
    <div className={styles.container}>
      <Panel variant="secondary" className={styles.section}>
        <h3 className={styles.sectionTitle}>Save Management</h3>
        <div className={styles.saveSlots}>
          {SLOTS.map((slot) => (
            <div key={slot} className={styles.saveSlot}>
              <span className={styles.slotLabel}>Slot {slot}</span>
              <div className={styles.slotActions}>
                <Button
                  variant="primary"
                  onClick={() => onSave?.(slot)}
                >
                  Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onLoad?.(slot)}
                >
                  Load
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onExport?.(slot)}
                >
                  Export
                </Button>
                {confirmDelete === slot ? (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => {
                        onDelete?.(slot);
                        setConfirmDelete(null);
                      }}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setConfirmDelete(null)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="danger"
                    onClick={() => setConfirmDelete(slot)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel variant="secondary" className={styles.section}>
        <h3 className={styles.sectionTitle}>Game Settings</h3>
        <div className={styles.settingRow}>
          <label className={styles.settingLabel}>
            <input
              type="checkbox"
              checked={autoEquip}
              onChange={(e) => setAutoEquip(e.target.checked)}
              className={styles.checkbox}
            />
            Auto-equip upgrades
          </label>
          <p className={styles.settingDesc}>
            Automatically equip items that are better than your current gear.
          </p>
        </div>
        <div className={styles.settingRow}>
          <label className={styles.settingLabel}>
            <input
              type="checkbox"
              checked={autoSellCommon}
              onChange={(e) => setAutoSellCommon(e.target.checked)}
              className={styles.checkbox}
            />
            Auto-sell Common items when inventory is full
          </label>
          <p className={styles.settingDesc}>
            Common (grey) items are sold automatically to make room for better loot.
          </p>
        </div>
      </Panel>

      <Panel variant="secondary" className={styles.section}>
        <h3 className={styles.sectionTitle}>About</h3>
        <p className={styles.aboutText}>Idle MMORPG v0.1.0</p>
        <p className={styles.aboutText}>
          No energy systems. No pay-to-win. Just idle MMORPG glory.
        </p>
      </Panel>
    </div>
  );
};
