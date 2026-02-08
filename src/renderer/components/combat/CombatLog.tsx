import React, { useRef, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import styles from './CombatLog.module.css';
import type { ICombatLogEntry } from '@shared/types/combat';

interface Props {
  entries: ICombatLogEntry[];
  maxEntries?: number;
}

const TYPE_COLORS: Record<string, string> = {
  damage_dealt: 'var(--combat-phys)',
  damage_taken: 'var(--stat-negative)',
  heal: 'var(--combat-heal)',
  ability_used: 'var(--combat-buff)',
  monster_killed: 'var(--text-gold)',
  player_death: 'var(--text-error)',
  xp_gained: 'var(--text-xp)',
  gold_gained: 'var(--text-gold)',
  loot_dropped: 'var(--quality-uncommon)',
  level_up: 'var(--text-system)',
  miss: 'var(--text-disabled)',
  dodge: 'var(--text-disabled)',
  parry: 'var(--text-disabled)',
  crit: 'var(--combat-crit)',
  buff_applied: 'var(--combat-buff)',
  buff_expired: 'var(--text-disabled)',
  debuff_applied: 'var(--stat-negative)',
  debuff_expired: 'var(--text-disabled)',
};

function formatLogEntry(entry: ICombatLogEntry): string {
  switch (entry.type) {
    case 'damage_dealt':
      return `${entry.source} hits ${entry.target} for ${entry.value ?? 0}${entry.isCritical ? ' (CRIT!)' : ''}`;
    case 'damage_taken':
      return `${entry.target} takes ${entry.value ?? 0} damage from ${entry.source}`;
    case 'heal':
      return `${entry.source} heals ${entry.target} for ${entry.value ?? 0}${entry.isCritical ? ' (CRIT!)' : ''}`;
    case 'monster_killed':
      return `${entry.target} has been slain!`;
    case 'xp_gained':
      return `+${entry.value ?? 0} XP`;
    case 'gold_gained':
      return `+${entry.value ?? 0} gold`;
    case 'loot_dropped':
      return `Loot: ${entry.itemName ?? 'Unknown Item'}`;
    case 'level_up':
      return `LEVEL UP! You are now level ${entry.value ?? 0}!`;
    case 'miss':
      return `${entry.source}'s attack missed ${entry.target}`;
    case 'dodge':
      return `${entry.target} dodged ${entry.source}'s attack`;
    case 'parry':
      return `${entry.target} parried ${entry.source}'s attack`;
    case 'player_death':
      return 'You have died! (-10% gold)';
    case 'ability_used':
      return `${entry.source} uses ${entry.abilityName ?? 'ability'}`;
    case 'buff_applied':
      return `${entry.target} gains ${entry.abilityName ?? 'buff'}`;
    case 'buff_expired':
      return `${entry.abilityName ?? 'Buff'} fades from ${entry.target}`;
    default:
      return `${entry.source}: ${entry.type}`;
  }
}

export const CombatLog: React.FC<Props> = ({ entries, maxEntries = 100 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const visible = entries.slice(-maxEntries);

  return (
    <Panel variant="inset" className={styles.logContainer}>
      <div
        className={styles.logScroll}
        ref={scrollRef}
        role="log"
        aria-label="Combat log"
        aria-live="polite"
      >
        {visible.map((entry, idx) => (
          <div
            key={idx}
            className={styles.logEntry}
            style={{ color: TYPE_COLORS[entry.type] ?? 'var(--text-secondary)' }}
          >
            {formatLogEntry(entry)}
          </div>
        ))}
        {visible.length === 0 && (
          <div className={styles.emptyLog}>Combat log is empty. Start fighting!</div>
        )}
      </div>
    </Panel>
  );
};
