import React from 'react';
import { Panel } from '../shared/Panel';
import { ProgressBar } from '../shared/ProgressBar';
import styles from './CharacterPanel.module.css';
import type { ICharacterSnapshot, IComputedStats } from '@shared/types/state';
import { ResourceType } from '@shared/types/enums';

interface Props {
  character: ICharacterSnapshot;
  stats: IComputedStats;
}

function getResourceVariant(type: ResourceType): 'mana' | 'energy' | 'rage' {
  switch (type) {
    case ResourceType.Mana: return 'mana';
    case ResourceType.Energy: return 'energy';
    case ResourceType.Rage: return 'rage';
    default: return 'mana';
  }
}

export const CharacterPanel: React.FC<Props> = ({ character, stats }) => {
  return (
    <div className={styles.container}>
      <Panel className={styles.headerPanel}>
        <h2 className={styles.characterName}>{character.name}</h2>
        <p className={styles.subtitle}>
          Level {character.level} {character.race} {character.classId}
        </p>
        <ProgressBar
          current={character.currentXP}
          max={character.xpToNextLevel}
          variant="xp"
          label={`${character.currentXP.toLocaleString()} / ${character.xpToNextLevel.toLocaleString()} XP`}
          className={styles.xpBar}
        />
      </Panel>

      <div className={styles.columns}>
        <Panel variant="secondary" className={styles.paperDoll}>
          <div className={styles.characterPreview}>
            <div className={styles.previewPlaceholder}>
              Paper Doll
            </div>
          </div>
        </Panel>

        <Panel variant="secondary" className={styles.statsPanel}>
          <h3 className={styles.statsTitle}>Primary Stats</h3>
          <div className={styles.statGrid}>
            <StatRow label="Strength" value={stats.primaryStats.str} />
            <StatRow label="Agility" value={stats.primaryStats.agi} />
            <StatRow label="Intellect" value={stats.primaryStats.int} />
            <StatRow label="Spirit" value={stats.primaryStats.spi} />
            <StatRow label="Stamina" value={stats.primaryStats.sta} />
          </div>

          <h3 className={styles.statsTitle}>Secondary Stats</h3>
          <div className={styles.statGrid}>
            <StatRow label="Attack Power" value={stats.attackPower} />
            <StatRow label="Spell Power" value={Math.floor(stats.spellPower)} />
            <StatRow label="Crit Chance" value={`${stats.criticalStrike.toFixed(1)}%`} />
            <StatRow label="Haste" value={`${stats.haste.toFixed(1)}%`} />
            <StatRow label="Hit Rating" value={`${stats.hitRating.toFixed(1)}%`} />
            <StatRow label="Armor" value={Math.floor(stats.armor)} />
            <StatRow label="Dodge" value={`${stats.dodge.toFixed(1)}%`} />
            <StatRow label="Max HP" value={stats.maxHealth.toLocaleString()} />
            <StatRow label="Max Mana" value={stats.maxMana.toLocaleString()} />
          </div>

          <h3 className={styles.statsTitle}>Misc</h3>
          <div className={styles.statGrid}>
            <StatRow label="Gold" value={character.gold.toLocaleString()} />
            <StatRow label="Kills" value={character.totalKills.toLocaleString()} />
            <StatRow label="Deaths" value={character.deathCount} />
            <StatRow label="Quests" value={character.totalQuestsCompleted} />
          </div>
        </Panel>
      </div>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className={styles.statRow}>
    <span className={styles.statLabel}>{label}</span>
    <span className={styles.statValue}>{value}</span>
  </div>
);
