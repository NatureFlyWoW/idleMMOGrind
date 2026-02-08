import React from 'react';
import { Panel } from '../shared/Panel';
import { Button } from '../shared/Button';
import styles from './OfflineProgressModal.module.css';

/** Offline progress result -- defined locally until engine module is available */
interface IOfflineResult {
  xpGained: number;
  goldGained: number;
  levelsGained: number;
  monstersKilled: number;
  questsCompleted: number;
  newLevel: number;
  newXP: number;
  simulatedSeconds: number;
  rawOfflineSeconds: number;
  catchUpMultiplier: number;
}

interface Props {
  result: IOfflineResult;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export const OfflineProgressModal: React.FC<Props> = ({ result, onClose }) => {
  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Offline progress summary"
    >
      <Panel className={styles.modal}>
        <h2 className={styles.title}>Welcome Back!</h2>
        <p className={styles.subtitle}>
          You were away for {formatDuration(result.rawOfflineSeconds)}
          {result.simulatedSeconds < result.rawOfflineSeconds && (
            <> (effective: {formatDuration(result.simulatedSeconds)})</>
          )}
        </p>

        <div className={styles.gains}>
          <GainRow
            icon="*"
            label="XP Gained"
            value={result.xpGained.toLocaleString()}
            color="var(--text-xp)"
          />
          {result.levelsGained > 0 && (
            <GainRow
              icon="^"
              label="Levels Gained"
              value={`+${result.levelsGained}`}
              color="var(--text-system)"
            />
          )}
          <GainRow
            icon="G"
            label="Gold Gained"
            value={result.goldGained.toLocaleString()}
            color="var(--text-gold)"
          />
          <GainRow
            icon="X"
            label="Monsters Killed"
            value={result.monstersKilled.toLocaleString()}
            color="var(--stat-negative)"
          />
          <GainRow
            icon="Q"
            label="Quests Completed"
            value={result.questsCompleted.toString()}
            color="var(--quality-uncommon)"
          />
        </div>

        {result.levelsGained > 0 && (
          <p className={styles.newLevel}>
            You are now Level {result.newLevel}!
          </p>
        )}

        {result.catchUpMultiplier > 1 && (
          <p className={styles.catchUp}>
            Catch-up bonus active: {result.catchUpMultiplier}x XP for the next 30 minutes!
          </p>
        )}

        <div className={styles.footer}>
          <Button variant="primary" onClick={onClose}>
            Continue Adventure
          </Button>
        </div>
      </Panel>
    </div>
  );
};

const GainRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className={styles.gainRow}>
    <span className={styles.gainIcon} style={{ color }} aria-hidden="true">{icon}</span>
    <span className={styles.gainLabel}>{label}</span>
    <span className={styles.gainValue} style={{ color }}>{value}</span>
  </div>
);
