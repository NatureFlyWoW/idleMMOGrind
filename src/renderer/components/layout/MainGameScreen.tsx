import React, { useState } from 'react';
import { Panel } from '../shared/Panel';
import styles from './MainGameScreen.module.css';

export type NavigationTab = 'overview' | 'character' | 'inventory' | 'talents' | 'quests' | 'settings';

const NAV_ITEMS: Array<{ id: NavigationTab; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: 'O' },
  { id: 'character', label: 'Character', icon: 'C' },
  { id: 'inventory', label: 'Inventory', icon: 'I' },
  { id: 'talents', label: 'Talents', icon: 'T' },
  { id: 'quests', label: 'Quests', icon: 'Q' },
  { id: 'settings', label: 'Settings', icon: 'S' },
];

export const MainGameScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');

  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar} aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`${styles.navButton} ${activeTab === item.id ? styles.active : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
            aria-label={item.label}
            aria-current={activeTab === item.id ? 'page' : undefined}
          >
            <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      <main className={styles.contentArea}>
        <Panel className={styles.mainPanel}>
          {activeTab === 'overview' && <div>Overview Tab - Combat log, character summary, quest tracker</div>}
          {activeTab === 'character' && <div>Character Tab - Paper doll, stats</div>}
          {activeTab === 'inventory' && <div>Inventory Tab - Bag grid, items</div>}
          {activeTab === 'talents' && <div>Talents Tab - 3 talent trees</div>}
          {activeTab === 'quests' && <div>Quests Tab - Quest journal</div>}
          {activeTab === 'settings' && <div>Settings Tab - Save management</div>}
        </Panel>
      </main>

      <footer className={styles.statusBar}>
        <span className={styles.statusItem}>Level 1</span>
        <span className={styles.statusItem}>Zone: Sunstone Valley</span>
        <span className={styles.statusItem}>Gold: 0</span>
        <span className={styles.statusItem}>DPS: 0</span>
      </footer>
    </div>
  );
};
