import React from 'react';
import { Panel } from '../shared/Panel';
import { ProgressBar } from '../shared/ProgressBar';
import { CombatLog } from '../combat/CombatLog';
import styles from './OverviewTab.module.css';
import type { IGameStateSnapshot } from '@shared/types/state';
import { ResourceType } from '@shared/types/enums';

interface Props {
  gameState: IGameStateSnapshot;
}

function getResourceBarVariant(resourceType: ResourceType): 'mana' | 'energy' | 'rage' {
  switch (resourceType) {
    case ResourceType.Mana: return 'mana';
    case ResourceType.Energy: return 'energy';
    case ResourceType.Rage: return 'rage';
    default: return 'mana';
  }
}

export const OverviewTab: React.FC<Props> = ({ gameState }) => {
  const { character, combat, activeQuest, currentZoneName, recentCombatLog } = gameState;

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <Panel variant="secondary" className={styles.combatPanel}>
          <h3 className={styles.sectionTitle}>Combat</h3>
          {combat.inCombat && combat.targetName ? (
            <div className={styles.targetInfo}>
              <span className={styles.targetName}>
                {combat.targetName} (Lv. {combat.targetLevel})
              </span>
              <ProgressBar
                current={combat.targetHP}
                max={combat.targetMaxHP}
                variant="health"
                label={`${Math.floor(combat.targetHP)} / ${Math.floor(combat.targetMaxHP)} HP`}
              />
            </div>
          ) : (
            <p className={styles.idle}>Seeking target...</p>
          )}
          {character && (
            <div className={styles.playerBars}>
              <ProgressBar
                current={combat.playerHP}
                max={combat.playerMaxHP}
                variant="health"
              />
              <ProgressBar
                current={combat.playerResource}
                max={combat.playerMaxResource}
                variant={getResourceBarVariant(combat.resourceType)}
              />
            </div>
          )}
          <div className={styles.dpsDisplay}>
            DPS: <span className={styles.dpsValue}>{combat.dps.toFixed(1)}</span>
          </div>
        </Panel>

        <Panel variant="secondary" className={styles.questPanel}>
          <h3 className={styles.sectionTitle}>
            Current Zone: {currentZoneName ?? 'Unknown'}
          </h3>
          {activeQuest ? (
            <div className={styles.questInfo}>
              <ProgressBar
                current={activeQuest.currentKills}
                max={activeQuest.requiredKills}
                variant="xp"
                label={`Quest: ${activeQuest.currentKills} / ${activeQuest.requiredKills} kills`}
              />
            </div>
          ) : (
            <p className={styles.idle}>No active quest</p>
          )}
        </Panel>
      </div>

      <div className={styles.logRow}>
        <CombatLog entries={recentCombatLog} />
      </div>
    </div>
  );
};
