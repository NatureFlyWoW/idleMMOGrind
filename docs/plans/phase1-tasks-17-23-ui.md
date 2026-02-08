# Phase 1 Implementation Plan — UI Screens (Tasks 17-23)

> Part of the [Phase 1 Implementation Plan](phase1-index.md) | **Status:** Pending

---

## Task 17 -- UI: Shared Components (Panels, Buttons, Bars, Tooltips)

**Worktree:** `feat/phase1-ui`
**Branch:** `feat/phase1-ui`
**Depends on:** Task 16

### Step 17.1 -- Create CSS theme variables

**File: `src/renderer/styles/global/theme.css`**

```css
:root {
  /* Panel backgrounds */
  --panel-bg: #1A1A1F;
  --panel-bg-alt: #12121A;

  /* Frame borders (gold/bronze) */
  --frame-border-outer: #8B7340;
  --frame-border-inner: #5C4D2E;
  --frame-border-highlight: #C9A84C;
  --frame-border-shadow: #3A2E1A;
  --separator: #3D3529;

  /* Item quality colors */
  --quality-common: #9D9D9D;
  --quality-uncommon: #1EFF00;
  --quality-rare: #0070DD;
  --quality-epic: #A335EE;
  --quality-legendary: #FF8000;

  /* Text colors */
  --text-primary: #E8D5B0;
  --text-secondary: #A89878;
  --text-disabled: #5A5040;
  --stat-positive: #1EFF00;
  --stat-negative: #FF3333;
  --stat-neutral: #FFFFFF;
  --text-xp: #C8A2C8;
  --text-gold: #FFD700;
  --text-system: #FFCC00;
  --text-error: #FF4444;
  --text-link: #3399FF;

  /* Combat colors */
  --combat-phys: #FFFFFF;
  --combat-spell: #FFFF00;
  --combat-crit: #FF4444;
  --combat-heal: #00FF00;
  --combat-buff: #00CCFF;

  /* Resource bar colors */
  --bar-health-fill: #CC2222;
  --bar-health-bg: #3A0A0A;
  --bar-health-border: #661111;
  --bar-mana-fill: #2255CC;
  --bar-mana-bg: #0A0A3A;
  --bar-mana-border: #112266;
  --bar-energy-fill: #CCCC22;
  --bar-energy-bg: #3A3A0A;
  --bar-energy-border: #666611;
  --bar-rage-fill: #CC2222;
  --bar-rage-bg: #3A0A0A;
  --bar-rage-border: #661111;
  --bar-xp-fill: #8844CC;
  --bar-xp-bg: #1A0A2A;
  --bar-xp-border: #442266;

  /* Scrollbar */
  --scrollbar-track: #252530;
  --scrollbar-thumb: #5C4D2E;
  --scrollbar-thumb-hover: #8B7340;

  /* Typography */
  --font-display: 'Cinzel Decorative', 'Cinzel', Georgia, serif;
  --font-heading: 'Cinzel', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', Consolas, monospace;

  /* Type scale */
  --text-xs: 0.625rem;
  --text-sm: 0.75rem;
  --text-base: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
  --text-2xl: 1.875rem;
  --text-3xl: 2.5rem;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

**File: `src/renderer/styles/global/reset.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  background-color: #0D0D12;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

img {
  image-rendering: pixelated;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 0;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
```

**Commit:** `feat(ui): add CSS theme variables and global reset styles`

### Step 17.2 -- Create Panel shared component

**File: `src/renderer/components/shared/Panel.tsx`**

```typescript
import React from 'react';
import styles from './Panel.module.css';

interface PanelProps {
  variant?: 'primary' | 'secondary' | 'inset';
  className?: string;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ variant = 'primary', className = '', children }) => {
  return (
    <div className={`${styles.panel} ${styles[variant]} ${className}`}>
      {children}
    </div>
  );
};
```

**File: `src/renderer/components/shared/Panel.module.css`**

```css
.panel {
  position: relative;
  padding: var(--spacing-md);
}

.primary {
  background: var(--panel-bg);
  border: 2px solid var(--frame-border-outer);
  box-shadow:
    inset 1px 1px 0 0 var(--frame-border-highlight),
    inset -1px -1px 0 0 var(--frame-border-shadow),
    0 0 0 1px var(--frame-border-shadow);
}

.secondary {
  background: var(--panel-bg-alt);
  border: 1px solid var(--frame-border-inner);
}

.inset {
  background: #0D0D12;
  border: 1px solid var(--separator);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}
```

**Commit:** `feat(ui): add Panel shared component with primary/secondary/inset variants`

### Step 17.3 -- Create Button, ProgressBar, and Tooltip components

**File: `src/renderer/components/shared/Button.tsx`**

```typescript
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  disabled = false,
  onClick,
  children,
  className = '',
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

**File: `src/renderer/components/shared/Button.module.css`**

```css
.button {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  padding: 8px 20px;
  border: 2px solid var(--frame-border-outer);
  cursor: pointer;
  transition: all 0.15s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary {
  background: linear-gradient(180deg, #5C4D2E 0%, #3A2E1A 100%);
  color: var(--text-primary);
  box-shadow: inset 0 1px 0 var(--frame-border-highlight);
}

.primary:hover:not(:disabled) {
  background: linear-gradient(180deg, #8B7340 0%, #5C4D2E 100%);
}

.secondary {
  background: var(--panel-bg);
  color: var(--text-secondary);
  border-color: var(--frame-border-inner);
}

.secondary:hover:not(:disabled) {
  background: var(--panel-bg-alt);
  color: var(--text-primary);
}

.danger {
  background: linear-gradient(180deg, #6B1A1A 0%, #3A0A0A 100%);
  color: #FF6666;
  border-color: #661111;
}
```

**File: `src/renderer/components/shared/ProgressBar.tsx`**

```typescript
import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  current: number;
  max: number;
  variant?: 'health' | 'mana' | 'energy' | 'rage' | 'xp';
  showText?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  variant = 'health',
  showText = true,
  label,
  className = '',
}) => {
  const percent = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  return (
    <div className={`${styles.barContainer} ${styles[variant]} ${className}`}>
      <div className={styles.barFill} style={{ width: `${percent}%` }} />
      {showText && (
        <span className={styles.barText}>
          {label ?? `${Math.floor(current)} / ${Math.floor(max)}`}
        </span>
      )}
    </div>
  );
};
```

**File: `src/renderer/components/shared/ProgressBar.module.css`**

```css
.barContainer {
  position: relative;
  height: 20px;
  border: 2px solid;
  overflow: hidden;
}

.barFill {
  height: 100%;
  transition: width 0.3s ease;
  background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%);
}

.barText {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  white-space: nowrap;
}

.health { border-color: var(--bar-health-border); background: var(--bar-health-bg); }
.health .barFill { background-color: var(--bar-health-fill); }

.mana { border-color: var(--bar-mana-border); background: var(--bar-mana-bg); }
.mana .barFill { background-color: var(--bar-mana-fill); }

.energy { border-color: var(--bar-energy-border); background: var(--bar-energy-bg); }
.energy .barFill { background-color: var(--bar-energy-fill); }

.rage { border-color: var(--bar-rage-border); background: var(--bar-rage-bg); }
.rage .barFill { background-color: var(--bar-rage-fill); }

.xp { border-color: var(--bar-xp-border); background: var(--bar-xp-bg); }
.xp .barFill { background-color: var(--bar-xp-fill); }
```

**Commit:** `feat(ui): add Button, ProgressBar shared components`

---

## Task 18 -- UI: Character Creation Screen

**Worktree:** `feat/phase1-ui` (continues)
**Depends on:** Task 17

### Step 18.1 -- Implement CharacterCreationScreen

**File: `src/renderer/components/character-creation/CharacterCreationScreen.tsx`**

```typescript
import React, { useState, useMemo } from 'react';
import { Panel } from '../shared/Panel';
import { Button } from '../shared/Button';
import styles from './CharacterCreationScreen.module.css';
import type { Race, CharacterClass } from '@shared/types/enums';

// Import static data for display
import racesData from '@data/races.json';
import classesData from '@data/classes.json';

interface Props {
  onComplete: (params: { name: string; race: string; classId: string }) => void;
}

export const CharacterCreationScreen: React.FC<Props> = ({ onComplete }) => {
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedRaceData = useMemo(
    () => racesData.find((r: any) => r.id === selectedRace),
    [selectedRace],
  );

  const selectedClassData = useMemo(
    () => classesData.find((c: any) => c.id === selectedClass),
    [selectedClass],
  );

  const isNameValid = characterName.trim().length >= 2
    && characterName.trim().length <= 16
    && /^[A-Za-z][A-Za-z'-]*$/.test(characterName.trim());

  const canCreate = selectedRace && selectedClass && isNameValid;

  const handleCreate = () => {
    if (!canCreate || isCreating) return;
    setIsCreating(true);
    onComplete({
      name: characterName.trim(),
      race: selectedRace!,
      classId: selectedClass!,
    });
  };

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Create Your Hero</h1>

      <div className={styles.content}>
        <Panel className={styles.racePanel}>
          <h2 className={styles.sectionTitle}>Choose Race</h2>
          <div className={styles.optionGrid}>
            {racesData.map((race: any) => (
              <button
                key={race.id}
                className={`${styles.optionCard} ${selectedRace === race.id ? styles.selected : ''}`}
                onClick={() => setSelectedRace(race.id)}
              >
                <span className={styles.optionName}>{race.name}</span>
                <span className={styles.optionDesc}>{race.racialAbility.name}</span>
              </button>
            ))}
          </div>
          {selectedRaceData && (
            <div className={styles.detailBox}>
              <p className={styles.lore}>{selectedRaceData.description}</p>
              <p className={styles.statLine}>
                STR +{selectedRaceData.statBonuses.str}{' '}
                AGI +{selectedRaceData.statBonuses.agi}{' '}
                INT +{selectedRaceData.statBonuses.int}{' '}
                SPI +{selectedRaceData.statBonuses.spi}{' '}
                STA +{selectedRaceData.statBonuses.sta}
              </p>
              <p className={styles.racial}>{selectedRaceData.racialAbility.description}</p>
            </div>
          )}
        </Panel>

        <Panel className={styles.classPanel}>
          <h2 className={styles.sectionTitle}>Choose Class</h2>
          <div className={styles.optionGrid}>
            {classesData.map((cls: any) => (
              <button
                key={cls.id}
                className={`${styles.optionCard} ${selectedClass === cls.id ? styles.selected : ''}`}
                onClick={() => setSelectedClass(cls.id)}
              >
                <span className={styles.optionName}>{cls.name}</span>
                <span className={styles.optionDesc}>{cls.armorType} | {cls.resourceType}</span>
              </button>
            ))}
          </div>
          {selectedClassData && (
            <div className={styles.detailBox}>
              <p className={styles.lore}>{selectedClassData.description}</p>
              <p className={styles.statLine}>
                Roles: {selectedClassData.roles.join(', ')}
              </p>
              <div className={styles.specList}>
                {selectedClassData.specs.map((spec: any) => (
                  <div key={spec.id} className={styles.specItem}>
                    <strong>{spec.name}</strong>: {spec.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel className={styles.namePanel}>
          <h2 className={styles.sectionTitle}>Name Your Character</h2>
          <input
            className={styles.nameInput}
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Enter name (2-16 characters)"
            maxLength={16}
          />
          {characterName.length > 0 && !isNameValid && (
            <p className={styles.nameError}>
              Name must be 2-16 letters, starting with a letter. Hyphens and apostrophes allowed.
            </p>
          )}
        </Panel>
      </div>

      <div className={styles.footer}>
        <Button
          variant="primary"
          disabled={!canCreate || isCreating}
          onClick={handleCreate}
        >
          {isCreating ? 'Creating...' : 'Start Adventure'}
        </Button>
      </div>
    </div>
  );
};
```

**File: `src/renderer/components/character-creation/CharacterCreationScreen.module.css`**

```css
.screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: var(--spacing-lg);
  background: var(--panel-bg-alt);
}

.title {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  text-align: center;
  color: var(--frame-border-highlight);
  margin-bottom: var(--spacing-lg);
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr auto;
  gap: var(--spacing-md);
  flex: 1;
  overflow-y: auto;
}

.racePanel { grid-column: 1; grid-row: 1; }
.classPanel { grid-column: 2; grid-row: 1; }
.namePanel { grid-column: 1 / -1; grid-row: 2; }

.sectionTitle {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--frame-border-highlight);
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--separator);
  padding-bottom: var(--spacing-xs);
}

.optionGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.optionCard {
  background: var(--panel-bg-alt);
  border: 1px solid var(--frame-border-inner);
  padding: var(--spacing-sm);
  cursor: pointer;
  text-align: center;
  color: var(--text-primary);
  font-family: var(--font-body);
  transition: all 0.15s;
}

.optionCard:hover {
  border-color: var(--frame-border-outer);
  background: var(--panel-bg);
}

.optionCard.selected {
  border-color: var(--frame-border-highlight);
  background: rgba(201, 168, 76, 0.1);
  box-shadow: 0 0 8px rgba(201, 168, 76, 0.3);
}

.optionName {
  display: block;
  font-weight: 600;
  font-size: var(--text-base);
}

.optionDesc {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

.detailBox {
  background: var(--panel-bg-alt);
  border: 1px solid var(--separator);
  padding: var(--spacing-sm);
}

.lore { color: var(--text-secondary); font-style: italic; margin-bottom: var(--spacing-xs); }
.statLine { font-family: var(--font-mono); color: var(--stat-positive); margin-bottom: var(--spacing-xs); }
.racial { color: var(--text-xp); }

.specList { display: flex; flex-direction: column; gap: 4px; margin-top: var(--spacing-xs); }
.specItem { font-size: var(--text-sm); color: var(--text-secondary); }

.nameInput {
  width: 100%;
  padding: 10px 14px;
  background: #0D0D12;
  border: 1px solid var(--frame-border-inner);
  color: var(--text-primary);
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  outline: none;
}

.nameInput:focus {
  border-color: var(--frame-border-highlight);
}

.nameError {
  color: var(--text-error);
  font-size: var(--text-sm);
  margin-top: var(--spacing-xs);
}

.footer {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-md);
}
```

**Commit:** `feat(ui): add CharacterCreationScreen with race, class, and name selection`

---

## Task 19 -- UI: Main Hub Layout (Sidebar, Tabs, Status Bar)

**Worktree:** `feat/phase1-ui` (continues)
**Depends on:** Task 17

### Step 19.1 -- Implement MainGameScreen layout

**File: `src/renderer/components/layout/MainGameScreen.tsx`**

```typescript
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
      <nav className={styles.sidebar}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`${styles.navButton} ${activeTab === item.id ? styles.active : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
          >
            <span className={styles.navIcon}>{item.icon}</span>
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
```

**File: `src/renderer/components/layout/MainGameScreen.module.css`**

```css
.layout {
  display: grid;
  grid-template-columns: 64px 1fr;
  grid-template-rows: 1fr 40px;
  height: 100vh;
  background: #0D0D12;
}

.sidebar {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  background: var(--panel-bg);
  border-right: 2px solid var(--frame-border-outer);
  padding: var(--spacing-xs) 0;
  gap: 2px;
}

.navButton {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 56px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--font-body);
}

.navButton:hover {
  background: rgba(139, 115, 64, 0.15);
  color: var(--text-primary);
}

.navButton.active {
  background: rgba(201, 168, 76, 0.2);
  color: var(--frame-border-highlight);
  border-left: 3px solid var(--frame-border-highlight);
}

.navIcon {
  font-size: var(--text-lg);
  font-weight: 700;
}

.navLabel {
  font-size: var(--text-xs);
  margin-top: 2px;
}

.contentArea {
  grid-column: 2;
  grid-row: 1;
  padding: var(--spacing-sm);
  overflow-y: auto;
}

.mainPanel {
  height: 100%;
}

.statusBar {
  grid-column: 1 / -1;
  grid-row: 2;
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: 0 var(--spacing-md);
  background: var(--panel-bg);
  border-top: 2px solid var(--frame-border-outer);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.statusItem {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
```

**Commit:** `feat(ui): add MainGameScreen layout with sidebar navigation and status bar`

---

## Task 20 -- UI: Character Panel (Paper Doll, Stats)

**Worktree:** `feat/phase1-ui` (continues)
**Depends on:** Tasks 17, 19

### Step 20.1 -- Implement CharacterPanel component

**File: `src/renderer/components/character/CharacterPanel.tsx`**

```typescript
import React from 'react';
import { Panel } from '../shared/Panel';
import { ProgressBar } from '../shared/ProgressBar';
import styles from './CharacterPanel.module.css';
import type { ICharacterSnapshot, IComputedStats } from '@shared/types/state';
import type { ResourceType } from '@shared/types/enums';

interface Props {
  character: ICharacterSnapshot;
  stats: IComputedStats;
}

function getResourceVariant(type: ResourceType): 'mana' | 'energy' | 'rage' {
  switch (type) {
    case 'mana': return 'mana';
    case 'energy': return 'energy';
    case 'rage': return 'rage';
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
```

**File: `src/renderer/components/character/CharacterPanel.module.css`**

```css
.container { display: flex; flex-direction: column; gap: var(--spacing-sm); height: 100%; }

.headerPanel { text-align: center; }

.characterName {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--frame-border-highlight);
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.xpBar { margin-top: var(--spacing-xs); }

.columns {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-sm);
  flex: 1;
  min-height: 0;
}

.paperDoll { display: flex; align-items: center; justify-content: center; }
.characterPreview { width: 256px; height: 512px; }
.previewPlaceholder {
  width: 100%;
  height: 100%;
  background: #0D0D12;
  border: 1px solid var(--separator);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-disabled);
  font-family: var(--font-heading);
}

.statsPanel { overflow-y: auto; }

.statsTitle {
  font-family: var(--font-heading);
  font-size: var(--text-md);
  color: var(--frame-border-highlight);
  border-bottom: 1px solid var(--separator);
  padding-bottom: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.statsTitle:first-child { margin-top: 0; }

.statGrid { display: flex; flex-direction: column; gap: 2px; }

.statRow {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.statLabel {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.statValue {
  font-family: var(--font-mono);
  color: var(--stat-neutral);
  font-size: var(--text-sm);
  font-feature-settings: "tnum";
}
```

**Commit:** `feat(ui): add CharacterPanel with paper doll placeholder and stat display`

---

## Task 21 -- UI: Inventory Screen (Grid, Item Slots, Tooltips)

**Worktree:** `feat/phase1-ui` (continues)
**Depends on:** Tasks 17, 20

### Step 21.1 -- Implement ItemSlot component

**File: `src/renderer/components/inventory/ItemSlot.tsx`**

```typescript
import React, { useState } from 'react';
import styles from './ItemSlot.module.css';
import type { IItem } from '@shared/types/item';
import type { ItemQuality } from '@shared/types/enums';

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
      className={`${styles.slot} ${qualityClass ? styles[qualityClass] : ''}`}
      onClick={() => item && onClick?.(item)}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {item ? (
        <div className={styles.itemIcon}>
          <span className={styles.itemInitial}>{item.name[0]}</span>
        </div>
      ) : (
        <span className={styles.emptyLabel}>{slotLabel ?? ''}</span>
      )}

      {showTooltip && item && (
        <div className={styles.tooltip}>
          <ItemTooltip item={item} />
        </div>
      )}
    </div>
  );
};

const ItemTooltip: React.FC<{ item: IItem }> = ({ item }) => {
  return (
    <div className={styles.tooltipContent}>
      <span className={`${styles.tooltipName} ${styles[QUALITY_CLASS[item.quality] ?? ''] ?? ''}`}>
        {item.name}
      </span>
      <span className={styles.tooltipILevel}>Item Level {item.iLevel}</span>
      <span className={styles.tooltipSlot}>{item.slot}</span>
      {item.weaponDamage && (
        <span className={styles.tooltipDamage}>
          {item.weaponDamage.min} - {item.weaponDamage.max} Damage
        </span>
      )}
      {item.weaponSpeed && (
        <span className={styles.tooltipSpeed}>Speed {item.weaponSpeed.toFixed(1)}</span>
      )}
      {Object.entries(item.primaryStats).map(([stat, value]) => (
        <span key={stat} className={styles.tooltipStat}>+{value} {stat.toUpperCase()}</span>
      ))}
      {Object.entries(item.secondaryStats).map(([stat, value]) => (
        <span key={stat} className={styles.tooltipSecondaryStat}>+{value} {stat}</span>
      ))}
      <span className={styles.tooltipReqLevel}>Requires Level {item.requiredLevel}</span>
      <span className={styles.tooltipSellValue}>Sell: {item.sellValue} gold</span>
    </div>
  );
};
```

**File: `src/renderer/components/inventory/ItemSlot.module.css`**

```css
.slot {
  width: 48px;
  height: 48px;
  background: #0D0D12;
  border: 2px solid #3D3529;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.slot:hover { border-color: var(--frame-border-outer); }

.qualityCommon { border-color: #4A4A4A; }
.qualityUncommon { border-color: #0D7A00; }
.qualityRare { border-color: #003D7A; }
.qualityEpic { border-color: #5C1D87; }
.qualityLegendary { border-color: #8A4500; }

.itemIcon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
}

.itemInitial {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
}

.emptyLabel {
  font-size: var(--text-xs);
  color: var(--text-disabled);
  text-align: center;
}

.tooltip {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 8px;
  z-index: 100;
  pointer-events: none;
}

.tooltipContent {
  background: var(--panel-bg);
  border: 2px solid var(--frame-border-outer);
  padding: var(--spacing-sm);
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.8);
}

.tooltipName { font-family: var(--font-heading); font-size: var(--text-md); }
.tooltipName.qualityCommon { color: var(--quality-common); }
.tooltipName.qualityUncommon { color: var(--quality-uncommon); }
.tooltipName.qualityRare { color: var(--quality-rare); }
.tooltipName.qualityEpic { color: var(--quality-epic); }
.tooltipName.qualityLegendary { color: var(--quality-legendary); }

.tooltipILevel { font-size: var(--text-xs); color: var(--text-gold); }
.tooltipSlot { font-size: var(--text-sm); color: var(--text-secondary); }
.tooltipDamage { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-primary); }
.tooltipSpeed { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-secondary); }
.tooltipStat { font-size: var(--text-sm); color: var(--stat-positive); }
.tooltipSecondaryStat { font-size: var(--text-sm); color: var(--stat-positive); }
.tooltipReqLevel { font-size: var(--text-xs); color: var(--text-secondary); margin-top: 4px; }
.tooltipSellValue { font-size: var(--text-xs); color: var(--text-gold); }
```

### Step 21.2 -- Implement InventoryGrid component

**File: `src/renderer/components/inventory/InventoryGrid.tsx`**

```typescript
import React from 'react';
import { Panel } from '../shared/Panel';
import { ItemSlot } from './ItemSlot';
import styles from './InventoryGrid.module.css';
import type { IItem } from '@shared/types/item';
import type { GearSlot } from '@shared/types/enums';

interface Props {
  equipment: Partial<Record<GearSlot, IItem | null>>;
  inventory: (IItem | null)[];
  onEquipItem?: (item: IItem) => void;
  onUnequipItem?: (slot: GearSlot) => void;
  onSellItem?: (item: IItem) => void;
}

const EQUIPMENT_LAYOUT: Array<{ slot: GearSlot; label: string }> = [
  { slot: 'head' as GearSlot, label: 'Head' },
  { slot: 'neck' as GearSlot, label: 'Neck' },
  { slot: 'shoulders' as GearSlot, label: 'Shoulders' },
  { slot: 'back' as GearSlot, label: 'Back' },
  { slot: 'chest' as GearSlot, label: 'Chest' },
  { slot: 'wrists' as GearSlot, label: 'Wrists' },
  { slot: 'hands' as GearSlot, label: 'Hands' },
  { slot: 'waist' as GearSlot, label: 'Waist' },
  { slot: 'legs' as GearSlot, label: 'Legs' },
  { slot: 'feet' as GearSlot, label: 'Feet' },
  { slot: 'ring1' as GearSlot, label: 'Ring' },
  { slot: 'ring2' as GearSlot, label: 'Ring' },
  { slot: 'trinket1' as GearSlot, label: 'Trinket' },
  { slot: 'trinket2' as GearSlot, label: 'Trinket' },
  { slot: 'main-hand' as GearSlot, label: 'Main Hand' },
  { slot: 'off-hand' as GearSlot, label: 'Off Hand' },
];

export const InventoryGrid: React.FC<Props> = ({
  equipment,
  inventory,
  onEquipItem,
  onUnequipItem,
  onSellItem,
}) => {
  return (
    <div className={styles.container}>
      <Panel variant="secondary" className={styles.equipmentPanel}>
        <h3 className={styles.title}>Equipment</h3>
        <div className={styles.equipGrid}>
          {EQUIPMENT_LAYOUT.map(({ slot, label }) => (
            <ItemSlot
              key={slot}
              item={equipment[slot] ?? null}
              slotLabel={label}
              onRightClick={() => onUnequipItem?.(slot)}
            />
          ))}
        </div>
      </Panel>

      <Panel variant="secondary" className={styles.bagPanel}>
        <h3 className={styles.title}>
          Bag ({inventory.filter(i => i !== null).length} / {inventory.length})
        </h3>
        <div className={styles.bagGrid}>
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
```

**File: `src/renderer/components/inventory/InventoryGrid.module.css`**

```css
.container { display: flex; gap: var(--spacing-md); height: 100%; }

.equipmentPanel { width: 280px; }
.bagPanel { flex: 1; }

.title {
  font-family: var(--font-heading);
  font-size: var(--text-md);
  color: var(--frame-border-highlight);
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--separator);
  padding-bottom: var(--spacing-xs);
}

.equipGrid {
  display: grid;
  grid-template-columns: repeat(4, 48px);
  gap: 4px;
  justify-content: center;
}

.bagGrid {
  display: grid;
  grid-template-columns: repeat(7, 48px);
  gap: 4px;
}
```

**Commit:** `feat(ui): add InventoryGrid and ItemSlot components with quality-colored tooltips`

---

## Task 22 -- UI: Combat Log and Overview Tab

**Worktree:** `feat/phase1-ui` (continues)
**Depends on:** Task 19

### Step 22.1 -- Implement CombatLog component

**File: `src/renderer/components/combat/CombatLog.tsx`**

```typescript
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
  crit: 'var(--combat-crit)',
};

function formatLogEntry(entry: ICombatLogEntry): string {
  switch (entry.type) {
    case 'damage_dealt':
      return `${entry.source} hits ${entry.target} for ${entry.value}${entry.isCritical ? ' (CRIT!)' : ''}`;
    case 'damage_taken':
      return `${entry.target} takes ${entry.value} damage from ${entry.source}`;
    case 'heal':
      return `${entry.source} heals ${entry.target} for ${entry.value}${entry.isCritical ? ' (CRIT!)' : ''}`;
    case 'monster_killed':
      return `${entry.target} has been slain!`;
    case 'xp_gained':
      return `+${entry.value} XP`;
    case 'gold_gained':
      return `+${entry.value} gold`;
    case 'loot_dropped':
      return `Loot: ${entry.itemName}`;
    case 'level_up':
      return `LEVEL UP! You are now level ${entry.value}!`;
    case 'miss':
      return `${entry.source}'s attack missed ${entry.target}`;
    case 'player_death':
      return `You have died! (-10% gold)`;
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
      <div className={styles.logScroll} ref={scrollRef}>
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
```

**File: `src/renderer/components/combat/CombatLog.module.css`**

```css
.logContainer {
  height: 100%;
  padding: var(--spacing-xs);
}

.logScroll {
  height: 100%;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.logEntry {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.emptyLog {
  color: var(--text-disabled);
  font-style: italic;
  text-align: center;
  padding-top: var(--spacing-lg);
}
```

### Step 22.2 -- Implement OverviewTab (combat + summary)

**File: `src/renderer/components/layout/OverviewTab.tsx`**

```typescript
import React from 'react';
import { Panel } from '../shared/Panel';
import { ProgressBar } from '../shared/ProgressBar';
import { CombatLog } from '../combat/CombatLog';
import styles from './OverviewTab.module.css';
import type { IGameStateSnapshot } from '@shared/types/state';

interface Props {
  gameState: IGameStateSnapshot;
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
              />
            </div>
          ) : (
            <p className={styles.idle}>Seeking target...</p>
          )}
          {character && (
            <div className={styles.playerBars}>
              <ProgressBar current={combat.playerHP} max={combat.playerMaxHP} variant="health" />
              <ProgressBar
                current={combat.playerResource}
                max={combat.playerMaxResource}
                variant={combat.resourceType === 'mana' ? 'mana' : combat.resourceType === 'energy' ? 'energy' : 'rage'}
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
```

**File: `src/renderer/components/layout/OverviewTab.module.css`**

```css
.container { display: flex; flex-direction: column; height: 100%; gap: var(--spacing-sm); }

.topRow { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); }

.logRow { flex: 1; min-height: 200px; }

.sectionTitle {
  font-family: var(--font-heading);
  font-size: var(--text-md);
  color: var(--frame-border-highlight);
  margin-bottom: var(--spacing-sm);
}

.combatPanel, .questPanel { padding: var(--spacing-sm); }

.targetInfo { margin-bottom: var(--spacing-sm); }

.targetName {
  display: block;
  font-family: var(--font-heading);
  font-size: var(--text-base);
  color: var(--stat-negative);
  margin-bottom: var(--spacing-xs);
}

.playerBars { display: flex; flex-direction: column; gap: var(--spacing-xs); margin-bottom: var(--spacing-sm); }

.dpsDisplay {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.dpsValue {
  color: var(--text-primary);
  font-weight: 600;
}

.questInfo { margin-top: var(--spacing-xs); }

.idle {
  color: var(--text-disabled);
  font-style: italic;
}
```

**Commit:** `feat(ui): add CombatLog and OverviewTab with combat display and quest tracker`

---

## Task 23 -- UI: Offline Progress Modal and Settings Screen

**Worktree:** `feat/phase1-ui` (continues)
**Depends on:** Task 17

### Step 23.1 -- Implement OfflineProgressModal

**File: `src/renderer/components/modals/OfflineProgressModal.tsx`**

```typescript
import React from 'react';
import { Panel } from '../shared/Panel';
import { Button } from '../shared/Button';
import styles from './OfflineProgressModal.module.css';
import type { IOfflineResult } from '@engine/offline/offline-calculator';

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
    <div className={styles.overlay}>
      <Panel className={styles.modal}>
        <h2 className={styles.title}>Welcome Back!</h2>
        <p className={styles.subtitle}>
          You were away for {formatDuration(result.rawOfflineSeconds)}
          {result.simulatedSeconds < result.rawOfflineSeconds && (
            <> (effective: {formatDuration(result.simulatedSeconds)})</>
          )}
        </p>

        <div className={styles.gains}>
          <GainRow icon="*" label="XP Gained" value={result.xpGained.toLocaleString()} color="var(--text-xp)" />
          {result.levelsGained > 0 && (
            <GainRow icon="^" label="Levels Gained" value={`+${result.levelsGained}`} color="var(--text-system)" />
          )}
          <GainRow icon="G" label="Gold Gained" value={result.goldGained.toLocaleString()} color="var(--text-gold)" />
          <GainRow icon="X" label="Monsters Killed" value={result.monstersKilled.toLocaleString()} color="var(--stat-negative)" />
          <GainRow icon="Q" label="Quests Completed" value={result.questsCompleted.toString()} color="var(--quality-uncommon)" />
        </div>

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

const GainRow: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className={styles.gainRow}>
    <span className={styles.gainIcon} style={{ color }}>{icon}</span>
    <span className={styles.gainLabel}>{label}</span>
    <span className={styles.gainValue} style={{ color }}>{value}</span>
  </div>
);
```

**File: `src/renderer/components/modals/OfflineProgressModal.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 480px;
  max-width: 90vw;
  text-align: center;
}

.title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--frame-border-highlight);
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-lg);
}

.gains {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.gainRow {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--panel-bg-alt);
  border: 1px solid var(--separator);
}

.gainIcon {
  font-size: var(--text-lg);
  width: 24px;
  text-align: center;
}

.gainLabel {
  flex: 1;
  text-align: left;
  color: var(--text-secondary);
}

.gainValue {
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: 600;
  font-feature-settings: "tnum";
}

.catchUp {
  color: var(--text-system);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-md);
  font-style: italic;
}

.footer {
  display: flex;
  justify-content: center;
}
```

**Commit:** `feat(ui): add OfflineProgressModal with gains summary display`

### Step 23.2 -- Implement SettingsTab

**File: `src/renderer/components/layout/SettingsTab.tsx`**

```typescript
import React, { useState } from 'react';
import { Panel } from '../shared/Panel';
import { Button } from '../shared/Button';
import styles from './SettingsTab.module.css';

interface Props {
  onSave?: (slot: 1 | 2 | 3) => void;
  onLoad?: (slot: 1 | 2 | 3) => void;
  onExport?: (slot: 1 | 2 | 3) => void;
  onDelete?: (slot: 1 | 2 | 3) => void;
}

export const SettingsTab: React.FC<Props> = ({ onSave, onLoad, onExport, onDelete }) => {
  const [autoEquip, setAutoEquip] = useState(true);
  const [autoSellCommon, setAutoSellCommon] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  return (
    <div className={styles.container}>
      <Panel variant="secondary" className={styles.section}>
        <h3 className={styles.sectionTitle}>Save Management</h3>
        <div className={styles.saveSlots}>
          {[1, 2, 3].map((slot) => (
            <div key={slot} className={styles.saveSlot}>
              <span className={styles.slotLabel}>Slot {slot}</span>
              <div className={styles.slotActions}>
                <Button variant="primary" onClick={() => onSave?.(slot as 1 | 2 | 3)}>Save</Button>
                <Button variant="secondary" onClick={() => onLoad?.(slot as 1 | 2 | 3)}>Load</Button>
                <Button variant="secondary" onClick={() => onExport?.(slot as 1 | 2 | 3)}>Export</Button>
                {confirmDelete === slot ? (
                  <>
                    <Button variant="danger" onClick={() => { onDelete?.(slot as 1 | 2 | 3); setConfirmDelete(null); }}>Confirm</Button>
                    <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="danger" onClick={() => setConfirmDelete(slot)}>Delete</Button>
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
            />
            Auto-equip upgrades
          </label>
        </div>
        <div className={styles.settingRow}>
          <label className={styles.settingLabel}>
            <input
              type="checkbox"
              checked={autoSellCommon}
              onChange={(e) => setAutoSellCommon(e.target.checked)}
            />
            Auto-sell Common items when inventory is full
          </label>
        </div>
      </Panel>

      <Panel variant="secondary" className={styles.section}>
        <h3 className={styles.sectionTitle}>About</h3>
        <p className={styles.aboutText}>Idle MMORPG v0.1.0</p>
        <p className={styles.aboutText}>No energy systems. No pay-to-win. Just idle MMORPG glory.</p>
      </Panel>
    </div>
  );
};
```

**File: `src/renderer/components/layout/SettingsTab.module.css`**

```css
.container { display: flex; flex-direction: column; gap: var(--spacing-md); }

.section { padding: var(--spacing-md); }

.sectionTitle {
  font-family: var(--font-heading);
  font-size: var(--text-md);
  color: var(--frame-border-highlight);
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--separator);
  padding-bottom: var(--spacing-xs);
}

.saveSlots { display: flex; flex-direction: column; gap: var(--spacing-sm); }

.saveSlot {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--panel-bg);
  border: 1px solid var(--separator);
}

.slotLabel {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  color: var(--text-primary);
  min-width: 60px;
}

.slotActions { display: flex; gap: var(--spacing-xs); }

.settingRow { margin-bottom: var(--spacing-xs); }

.settingLabel {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.aboutText { color: var(--text-secondary); font-size: var(--text-sm); }
```

**Commit:** `feat(ui): add SettingsTab with save slot management and game options`

---

