import React, { useState } from 'react';
import styles from './ItemSlot.module.css';
import type { IItem } from '@shared/types/item';

interface Props {
  item: IItem | null;
  slotLabel?: string;
  onClick?: (item: IItem) => void;
  onRightClick?: (item: IItem) => void;
}

const QUALITY_CLASS: Record<string, string> = {
  common: 'qualityCommon',
  uncommon: 'qualityUncommon',
  rare: 'qualityRare',
  epic: 'qualityEpic',
  legendary: 'qualityLegendary',
};

export const ItemSlot: React.FC<Props> = ({ item, slotLabel, onClick, onRightClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const qualityClass = item ? (QUALITY_CLASS[item.quality] ?? '') : '';

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (item && onRightClick) onRightClick(item);
  };

  return (
    <div
      className={`${styles.slot} ${qualityClass ? (styles[qualityClass] ?? '') : ''}`}
      onClick={() => item && onClick?.(item)}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="button"
      tabIndex={0}
      aria-label={item ? `${item.name} - ${item.quality} ${item.slot}` : slotLabel ?? 'Empty slot'}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && item && onClick) onClick(item);
      }}
    >
      {item ? (
        <div className={styles.itemIcon}>
          <span className={styles.itemInitial}>{item.name[0]}</span>
        </div>
      ) : (
        <span className={styles.emptyLabel}>{slotLabel ?? ''}</span>
      )}

      {showTooltip && item && (
        <div className={styles.tooltip} role="tooltip">
          <ItemTooltip item={item} />
        </div>
      )}
    </div>
  );
};

const ItemTooltip: React.FC<{ item: IItem }> = ({ item }) => {
  const qualityClass = QUALITY_CLASS[item.quality] ?? '';

  return (
    <div className={styles.tooltipContent}>
      <span className={`${styles.tooltipName} ${qualityClass ? (styles[qualityClass] ?? '') : ''}`}>
        {item.name}
      </span>
      <span className={styles.tooltipILevel}>Item Level {item.iLevel}</span>
      <span className={styles.tooltipSlot}>{item.slot}</span>
      {item.weaponDamage && (
        <span className={styles.tooltipDamage}>
          {item.weaponDamage.min} - {item.weaponDamage.max} Damage
        </span>
      )}
      {item.weaponSpeed !== undefined && (
        <span className={styles.tooltipSpeed}>Speed {item.weaponSpeed.toFixed(1)}</span>
      )}
      {item.armor !== undefined && item.armor > 0 && (
        <span className={styles.tooltipStat}>{item.armor} Armor</span>
      )}
      {Object.entries(item.primaryStats).map(([stat, value]) =>
        value !== undefined ? (
          <span key={stat} className={styles.tooltipStat}>+{value} {stat.toUpperCase()}</span>
        ) : null
      )}
      {Object.entries(item.secondaryStats).map(([stat, value]) => (
        <span key={stat} className={styles.tooltipSecondaryStat}>+{value} {stat}</span>
      ))}
      {item.durability && (
        <span className={styles.tooltipDurability}>
          Durability {item.durability.current} / {item.durability.max}
        </span>
      )}
      <span className={styles.tooltipReqLevel}>Requires Level {item.requiredLevel}</span>
      <span className={styles.tooltipSellValue}>Sell: {item.sellValue} gold</span>
      {item.flavorText && (
        <span className={styles.tooltipFlavor}>{item.flavorText}</span>
      )}
    </div>
  );
};
