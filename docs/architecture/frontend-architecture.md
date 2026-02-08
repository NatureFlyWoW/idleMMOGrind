# Frontend Architecture Document
## Idle MMORPG — Electron + React UI

**Version:** 1.0
**Author:** @idle-mmo-frontend-dev
**Last Updated:** 2026-02-08
**Status:** Foundation Document for Phase 1 Implementation

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [React Application Structure](#2-react-application-structure)
3. [State Management Strategy](#3-state-management-strategy)
4. [Component Architecture](#4-component-architecture)
5. [Shared Component Library](#5-shared-component-library)
6. [CSS/Styling Strategy](#6-cssstyling-strategy)
7. [Performance Optimizations](#7-performance-optimizations)
8. [Key Hooks Design](#8-key-hooks-design)
9. [IPC Integration Layer](#9-ipc-integration-layer)
10. [File Structure](#10-file-structure)

---

## 1. Architecture Overview

### 1.1 Process Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON MAIN PROCESS                     │
│  - Window management                                         │
│  - Save/load orchestration                                   │
│  - IPC router between renderer and engine                    │
└─────────────────┬───────────────────────────┬───────────────┘
                  │                           │
                  │ IPC                       │ postMessage
                  │                           │
        ┌─────────▼─────────┐       ┌────────▼────────────┐
        │  RENDERER PROCESS  │       │  WORKER THREAD      │
        │  (React UI)        │◄──────┤  (Game Engine)      │
        │                    │  IPC  │                     │
        │  - Components      │       │  - Combat           │
        │  - State hooks     │       │  - Progression      │
        │  - Visual feedback │       │  - Offline calc     │
        └────────────────────┘       └─────────────────────┘
```

### 1.2 Data Flow

```
User Action (Click, Drag)
    ↓
React Event Handler
    ↓
Action Dispatch (IPC send to engine)
    ↓
Game Engine Worker processes
    ↓
Engine emits state update
    ↓
IPC receive in renderer
    ↓
GameStateContext updates
    ↓
React components re-render (with selectors)
    ↓
Visual feedback to user
```

### 1.3 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18 | Component architecture, concurrent features |
| **Language** | TypeScript 5.x | Type safety, IDE support |
| **Styling** | CSS Modules | Scoped styles, no runtime overhead |
| **State** | React Context + Hooks | Game state subscription, local UI state |
| **Rendering** | DOM (Phase 1) | Character sheets, menus, panels |
| | Canvas (Phase 2+) | Sprite rendering for combat visualization |
| **Virtualization** | react-window | Combat log, large lists |
| **Animation** | CSS Transitions + Keyframes | 60fps GPU-accelerated animations |
| **Build** | Vite | Fast HMR, optimized production builds |

---

## 2. React Application Structure

### 2.1 Application Entry Point

**File:** `src/renderer/index.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { GameStateProvider } from './providers/GameStateProvider';
import { UIStateProvider } from './providers/UIStateProvider';
import './styles/global/reset.css';
import './styles/global/theme.css';
import './styles/global/typography.css';

// Initialize Electron IPC bridge
window.gameAPI.initialize();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameStateProvider>
      <UIStateProvider>
        <App />
      </UIStateProvider>
    </GameStateProvider>
  </React.StrictMode>
);
```

### 2.2 Root Application Component

**File:** `src/renderer/App.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { CharacterCreationScreen } from './components/character-creation/CharacterCreationScreen';
import { MainGameScreen } from './components/layout/MainGameScreen';
import { LoadingScreen } from './components/shared/LoadingScreen';
import { OfflineProgressModal } from './components/modals/OfflineProgressModal';

type AppState = 'loading' | 'character-creation' | 'main-game';

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const character = useGameState(state => state.character);
  const offlineProgress = useGameState(state => state.offlineProgress);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  useEffect(() => {
    // On mount, request initial game state from engine
    window.gameAPI.send('request-initial-state');

    window.gameAPI.on('initial-state', (data) => {
      if (data.character === null) {
        setAppState('character-creation');
      } else {
        setAppState('main-game');

        // Show offline progress if player was offline
        if (data.offlineProgress && data.offlineProgress.duration > 0) {
          setShowOfflineModal(true);
        }
      }
    });
  }, []);

  if (appState === 'loading') {
    return <LoadingScreen />;
  }

  if (appState === 'character-creation') {
    return (
      <CharacterCreationScreen
        onComplete={() => setAppState('main-game')}
      />
    );
  }

  return (
    <>
      <MainGameScreen />
      {showOfflineModal && offlineProgress && (
        <OfflineProgressModal
          progress={offlineProgress}
          onClose={() => setShowOfflineModal(false)}
        />
      )}
    </>
  );
};
```

### 2.3 Route/Tab Structure

The game is a **single-page application** with tab-based navigation. No React Router needed.

```
Character Creation (initial screen if no save)
    ↓
Main Hub (persistent layout with tabs)
    ├── Overview (default) — Character summary, combat log, quest tracker
    ├── Character — Paper doll, stats, buffs
    ├── Inventory — Bag grid, item management
    ├── Talents — 3 talent trees
    ├── Quests — Quest journal
    ├── Dungeons — Dungeon/raid browser
    ├── Professions — Crafting UI
    ├── Achievements — Progress tracking
    └── Settings — Game settings, save/export
```

**Implementation:**

```typescript
// src/renderer/components/layout/MainGameScreen.tsx
export const MainGameScreen: React.FC = () => {
  const activeTab = useUIState(state => state.activeTab);

  return (
    <div className={styles.mainGameScreen}>
      <TopBar />

      <div className={styles.contentArea}>
        <SidePanel /> {/* Character summary, combat log, quest tracker */}

        <div className={styles.mainPanel}>
          <NavigationTabs />

          <div className={styles.tabContent}>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'character' && <CharacterTab />}
            {activeTab === 'inventory' && <InventoryTab />}
            {activeTab === 'talents' && <TalentsTab />}
            {activeTab === 'quests' && <QuestsTab />}
            {activeTab === 'dungeons' && <DungeonsTab />}
            {activeTab === 'professions' && <ProfessionsTab />}
            {activeTab === 'achievements' && <AchievementsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>

      <StatusBar /> {/* DPS, gold/hour, next level time */}
    </div>
  );
};
```

---

## 3. State Management Strategy

### 3.1 State Separation

We separate **game state** (from the engine worker) from **UI state** (local to the renderer).

```typescript
// Game State (read-only in frontend, owned by engine)
interface GameState {
  character: CharacterState | null;
  combat: CombatState;
  inventory: InventoryState;
  equipment: EquipmentState;
  talents: TalentState;
  quests: QuestState;
  dungeons: DungeonState;
  professions: ProfessionState;
  currencies: CurrencyState;
  reputation: ReputationState;
  offlineProgress: OfflineProgressState | null;
  timestamp: number; // For time-based UI updates
}

// UI State (local to renderer, ephemeral)
interface UIState {
  activeTab: NavigationTab;
  tooltip: TooltipState | null;
  draggedItem: DraggedItemState | null;
  combatLogFilters: LogFilter[];
  modalStack: ModalConfig[];
  expandedPanels: Set<string>;
  sortPreferences: SortPreferences;
  // ... etc
}
```

### 3.2 Game State Provider

**File:** `src/renderer/providers/GameStateProvider.tsx`

```typescript
import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import type { GameState } from '@shared/types/GameState';

interface GameStateContextValue {
  state: GameState;
  subscribe: (selector: (state: GameState) => any) => void;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameStateReducer, initialGameState);
  const subscribersRef = useRef(new Map<number, (state: GameState) => any>());
  const subscriptionIdRef = useRef(0);

  useEffect(() => {
    // Listen for state updates from engine
    const unsubscribe = window.gameAPI.on('game-state-update', (newState: Partial<GameState>) => {
      dispatch({ type: 'UPDATE', payload: newState });
    });

    return unsubscribe;
  }, []);

  const contextValue: GameStateContextValue = {
    state,
    subscribe: (selector) => {
      const id = subscriptionIdRef.current++;
      subscribersRef.current.set(id, selector);
      return () => subscribersRef.current.delete(id);
    }
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
};

function gameStateReducer(state: GameState, action: any): GameState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, ...action.payload };
    case 'RESET':
      return initialGameState;
    default:
      return state;
  }
}

const initialGameState: GameState = {
  character: null,
  combat: { isActive: false, log: [], dps: 0, currentTarget: null },
  inventory: { slots: [], gold: 0 },
  equipment: { slots: {} },
  talents: { trees: [], pointsSpent: 0, pointsAvailable: 0 },
  quests: { active: [], completed: [], available: [] },
  dungeons: { unlocked: [], lockouts: [] },
  professions: { skills: [], recipes: [] },
  currencies: { gold: 0, justicePoints: 0, valorPoints: 0 },
  reputation: { factions: [] },
  offlineProgress: null,
  timestamp: Date.now()
};

export const useGameStateContext = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameStateContext must be used within GameStateProvider');
  }
  return context;
};
```

### 3.3 Selector-Based Subscriptions

To prevent unnecessary re-renders, components subscribe to **specific slices** of game state.

**File:** `src/renderer/hooks/useGameState.ts`

```typescript
import { useEffect, useState, useRef } from 'react';
import { useGameStateContext } from '../providers/GameStateProvider';
import type { GameState } from '@shared/types/GameState';

/**
 * Subscribe to a slice of game state using a selector function.
 * Component only re-renders when the selected data changes (shallow equality).
 *
 * @example
 * const characterLevel = useGameState(state => state.character?.level);
 * const inventorySlots = useGameState(state => state.inventory.slots);
 */
export function useGameState<T>(selector: (state: GameState) => T): T {
  const { state } = useGameStateContext();
  const [selectedState, setSelectedState] = useState<T>(() => selector(state));
  const selectorRef = useRef(selector);
  const previousValueRef = useRef<T>(selectedState);

  // Update selector ref if it changes
  useEffect(() => {
    selectorRef.current = selector;
  }, [selector]);

  // Subscribe to state changes
  useEffect(() => {
    const newValue = selectorRef.current(state);

    // Only update if value changed (shallow comparison)
    if (!shallowEqual(newValue, previousValueRef.current)) {
      setSelectedState(newValue);
      previousValueRef.current = newValue;
    }
  }, [state]);

  return selectedState;
}

function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (let key of keysA) {
    if (a[key] !== b[key]) return false;
  }

  return true;
}
```

### 3.4 UI State Provider

**File:** `src/renderer/providers/UIStateProvider.tsx`

```typescript
import React, { createContext, useContext, useState } from 'react';
import type { UIState, NavigationTab, TooltipState, DraggedItemState } from '../types/UIState';

interface UIStateContextValue {
  uiState: UIState;
  setActiveTab: (tab: NavigationTab) => void;
  showTooltip: (tooltip: TooltipState) => void;
  hideTooltip: () => void;
  startDrag: (item: DraggedItemState) => void;
  endDrag: () => void;
  // ... more UI actions
}

const UIStateContext = createContext<UIStateContextValue | null>(null);

export const UIStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiState, setUIState] = useState<UIState>({
    activeTab: 'overview',
    tooltip: null,
    draggedItem: null,
    combatLogFilters: [],
    modalStack: [],
    expandedPanels: new Set(),
    sortPreferences: {}
  });

  const contextValue: UIStateContextValue = {
    uiState,
    setActiveTab: (tab) => setUIState(prev => ({ ...prev, activeTab: tab })),
    showTooltip: (tooltip) => setUIState(prev => ({ ...prev, tooltip })),
    hideTooltip: () => setUIState(prev => ({ ...prev, tooltip: null })),
    startDrag: (item) => setUIState(prev => ({ ...prev, draggedItem: item })),
    endDrag: () => setUIState(prev => ({ ...prev, draggedItem: null })),
  };

  return (
    <UIStateContext.Provider value={contextValue}>
      {children}
    </UIStateContext.Provider>
  );
};

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within UIStateProvider');
  }
  return context.uiState;
};

export const useUIActions = () => {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIActions must be used within UIStateProvider');
  }
  return context;
};
```

---

## 4. Component Architecture

### 4.1 Character Creation Screen

**Purpose:** First-time user experience. Create character with race, class, name.

**File:** `src/renderer/components/character-creation/CharacterCreationScreen.tsx`

```typescript
import React, { useState } from 'react';
import { RacePicker } from './RacePicker';
import { ClassPicker } from './ClassPicker';
import { NameInput } from './NameInput';
import { StatPreview } from './StatPreview';
import { Button } from '../shared/Button';
import styles from './CharacterCreationScreen.module.css';
import type { Race, Class } from '@shared/types/Character';

interface Props {
  onComplete: () => void;
}

export const CharacterCreationScreen: React.FC<Props> = ({ onComplete }) => {
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!selectedRace || !selectedClass || !characterName.trim()) return;

    setIsCreating(true);

    await window.gameAPI.send('create-character', {
      race: selectedRace,
      class: selectedClass,
      name: characterName
    });

    // Engine will respond with character-created event
    window.gameAPI.once('character-created', () => {
      onComplete();
    });
  };

  const canCreate = selectedRace && selectedClass && characterName.trim().length >= 3;

  return (
    <div className={styles.characterCreationScreen}>
      <div className={styles.header}>
        <h1>Create Your Hero</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.leftPanel}>
          <RacePicker
            selected={selectedRace}
            onSelect={setSelectedRace}
          />

          <ClassPicker
            selected={selectedClass}
            onSelect={setSelectedClass}
            availableClasses={selectedRace?.availableClasses}
          />
        </div>

        <div className={styles.centerPanel}>
          <div className={styles.characterPreview}>
            {/* 3D model or sprite preview (Phase 2) */}
            <div className={styles.placeholder}>Character Preview</div>
          </div>

          <NameInput
            value={characterName}
            onChange={setCharacterName}
          />
        </div>

        <div className={styles.rightPanel}>
          <StatPreview
            race={selectedRace}
            class={selectedClass}
          />
        </div>
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

**Component Structure:**

```
CharacterCreationScreen/
├── CharacterCreationScreen.tsx
├── CharacterCreationScreen.module.css
├── RacePicker.tsx
├── RacePicker.module.css
├── ClassPicker.tsx
├── ClassPicker.module.css
├── NameInput.tsx
├── StatPreview.tsx
└── index.ts
```

### 4.2 Main Hub Screen

**Purpose:** Persistent game layout with live-updating panels.

**File:** `src/renderer/components/layout/MainGameScreen.tsx`

```typescript
import React from 'react';
import { TopBar } from './TopBar';
import { SidePanel } from './SidePanel';
import { NavigationTabs } from './NavigationTabs';
import { StatusBar } from './StatusBar';
import { TabContent } from './TabContent';
import { TooltipOverlay } from '../shared/TooltipOverlay';
import { ModalStack } from '../shared/ModalStack';
import styles from './MainGameScreen.module.css';

export const MainGameScreen: React.FC = () => {
  return (
    <div className={styles.mainGameScreen}>
      <TopBar />

      <div className={styles.contentArea}>
        <SidePanel />

        <div className={styles.mainPanel}>
          <NavigationTabs />
          <TabContent />
        </div>
      </div>

      <StatusBar />

      {/* Overlays */}
      <TooltipOverlay />
      <ModalStack />
    </div>
  );
};
```

**Layout Structure (CSS Grid):**

```css
/* MainGameScreen.module.css */
.mainGameScreen {
  display: grid;
  grid-template-rows: 60px 1fr 40px;
  grid-template-columns: 300px 1fr;
  grid-template-areas:
    "topbar topbar"
    "sidebar main"
    "statusbar statusbar";
  height: 100vh;
  background: var(--bg-primary);
  overflow: hidden;
}

.contentArea {
  grid-area: sidebar / main;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  overflow: hidden;
}

.mainPanel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  overflow: hidden;
}
```

### 4.3 Character/Equipment Screen (Paper Doll)

**Purpose:** Gear visualization, stat display, buff tracking.

**File:** `src/renderer/components/character/CharacterTab.tsx`

```typescript
import React from 'react';
import { PaperDoll } from './PaperDoll';
import { StatPanel } from './StatPanel';
import { BuffBar } from './BuffBar';
import { useGameState } from '../../hooks/useGameState';
import styles from './CharacterTab.module.css';

export const CharacterTab: React.FC = () => {
  const character = useGameState(state => state.character);
  const equipment = useGameState(state => state.equipment);
  const buffs = useGameState(state => state.combat.activeBuffs);

  if (!character) return null;

  return (
    <div className={styles.characterTab}>
      <div className={styles.leftPanel}>
        <div className={styles.characterHeader}>
          <h2>{character.name}</h2>
          <div className={styles.subtitle}>
            Level {character.level} {character.race} {character.class}
          </div>
        </div>

        <BuffBar buffs={buffs} />

        <PaperDoll equipment={equipment} />
      </div>

      <div className={styles.rightPanel}>
        <StatPanel character={character} equipment={equipment} />
      </div>
    </div>
  );
};
```

**Paper Doll Component:**

```typescript
// src/renderer/components/character/PaperDoll.tsx
import React from 'react';
import { GearSlot } from './GearSlot';
import type { EquipmentState, GearSlotType } from '@shared/types/Equipment';
import styles from './PaperDoll.module.css';

const GEAR_SLOTS: GearSlotType[] = [
  'head', 'neck', 'shoulder', 'back', 'chest',
  'wrist', 'hands', 'waist', 'legs', 'feet',
  'finger1', 'finger2', 'trinket1', 'trinket2', 'weapon'
];

interface Props {
  equipment: EquipmentState;
}

export const PaperDoll: React.FC<Props> = ({ equipment }) => {
  return (
    <div className={styles.paperDoll}>
      {/* Character avatar in center */}
      <div className={styles.characterAvatar}>
        <img src="/assets/character-silhouette.png" alt="Character" />
      </div>

      {/* Gear slots positioned around avatar */}
      {GEAR_SLOTS.map(slotType => (
        <GearSlot
          key={slotType}
          slotType={slotType}
          item={equipment.slots[slotType]}
          className={styles[slotType]}
        />
      ))}
    </div>
  );
};
```

**Gear Slot Positioning (CSS Grid):**

```css
/* PaperDoll.module.css */
.paperDoll {
  position: relative;
  width: 400px;
  height: 600px;
  margin: 0 auto;
}

.characterAvatar {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 400px;
  z-index: 1;
}

/* Gear slot positions (absolute) */
.head { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); }
.neck { position: absolute; top: 80px; left: 50%; transform: translateX(-50%); }
.shoulder { position: absolute; top: 120px; left: 20px; }
.back { position: absolute; top: 120px; right: 20px; }
.chest { position: absolute; top: 200px; left: 50%; transform: translateX(-50%); }
/* ... etc for all 15 slots */
```

### 4.4 Inventory Screen

**Purpose:** Grid-based bag system with drag-and-drop.

**File:** `src/renderer/components/inventory/InventoryTab.tsx`

```typescript
import React from 'react';
import { BagGrid } from './BagGrid';
import { useGameState } from '../../hooks/useGameState';
import { useDragDrop } from '../../hooks/useDragDrop';
import styles from './InventoryTab.module.css';

export const InventoryTab: React.FC = () => {
  const inventory = useGameState(state => state.inventory);
  const { draggedItem, startDrag, endDrag, handleDrop } = useDragDrop();

  return (
    <div className={styles.inventoryTab}>
      <div className={styles.header}>
        <h2>Inventory</h2>
        <div className={styles.goldDisplay}>
          <img src="/assets/icons/gold.png" alt="Gold" />
          {formatNumber(inventory.gold)}
        </div>
      </div>

      <BagGrid
        slots={inventory.slots}
        onDragStart={startDrag}
        onDragEnd={endDrag}
        onDrop={handleDrop}
      />
    </div>
  );
};
```

**Bag Grid Component:**

```typescript
// src/renderer/components/inventory/BagGrid.tsx
import React from 'react';
import { ItemSlot } from '../shared/ItemSlot';
import type { InventorySlot } from '@shared/types/Inventory';
import styles from './BagGrid.module.css';

interface Props {
  slots: InventorySlot[];
  onDragStart: (slot: InventorySlot) => void;
  onDragEnd: () => void;
  onDrop: (targetSlot: number) => void;
}

export const BagGrid: React.FC<Props> = ({ slots, onDragStart, onDragEnd, onDrop }) => {
  return (
    <div className={styles.bagGrid}>
      {slots.map((slot, index) => (
        <ItemSlot
          key={index}
          slot={slot}
          index={index}
          onDragStart={() => slot.item && onDragStart(slot)}
          onDragEnd={onDragEnd}
          onDrop={() => onDrop(index)}
        />
      ))}
    </div>
  );
};
```

**Grid Layout:**

```css
/* BagGrid.module.css */
.bagGrid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-md);
}
```

### 4.5 Talent Tree Screen

**Purpose:** Visual talent tree with node interactions.

**File:** `src/renderer/components/talents/TalentsTab.tsx`

```typescript
import React, { useState } from 'react';
import { TalentTree } from './TalentTree';
import { useGameState } from '../../hooks/useGameState';
import { Button } from '../shared/Button';
import styles from './TalentsTab.module.css';
import type { TalentTreeType } from '@shared/types/Talents';

export const TalentsTab: React.FC = () => {
  const talents = useGameState(state => state.talents);
  const [activeTree, setActiveTree] = useState<TalentTreeType>('tree1');

  const handleInvestPoint = (nodeId: string) => {
    window.gameAPI.send('talent-invest', { nodeId });
  };

  const handleRemovePoint = (nodeId: string) => {
    window.gameAPI.send('talent-remove', { nodeId });
  };

  const handleRespec = () => {
    if (confirm('Respec all talents? This will cost gold.')) {
      window.gameAPI.send('talent-respec');
    }
  };

  return (
    <div className={styles.talentsTab}>
      <div className={styles.header}>
        <h2>Talents</h2>
        <div className={styles.pointsDisplay}>
          Points Available: {talents.pointsAvailable}
        </div>
        <Button variant="secondary" onClick={handleRespec}>
          Respec
        </Button>
      </div>

      <div className={styles.treeTabs}>
        {talents.trees.map(tree => (
          <button
            key={tree.id}
            className={activeTree === tree.id ? styles.activeTab : styles.tab}
            onClick={() => setActiveTree(tree.id)}
          >
            {tree.name}
            <span className={styles.pointsSpent}>
              ({tree.pointsSpent}/{tree.maxPoints})
            </span>
          </button>
        ))}
      </div>

      <div className={styles.treeContainer}>
        {talents.trees.map(tree => (
          tree.id === activeTree && (
            <TalentTree
              key={tree.id}
              tree={tree}
              onInvest={handleInvestPoint}
              onRemove={handleRemovePoint}
            />
          )
        ))}
      </div>
    </div>
  );
};
```

**Talent Tree Component:**

```typescript
// src/renderer/components/talents/TalentTree.tsx
import React from 'react';
import { TalentNode } from './TalentNode';
import { TalentConnections } from './TalentConnections';
import type { TalentTreeData } from '@shared/types/Talents';
import styles from './TalentTree.module.css';

interface Props {
  tree: TalentTreeData;
  onInvest: (nodeId: string) => void;
  onRemove: (nodeId: string) => void;
}

export const TalentTree: React.FC<Props> = ({ tree, onInvest, onRemove }) => {
  return (
    <div className={styles.talentTree}>
      {/* SVG overlay for connection lines */}
      <TalentConnections nodes={tree.nodes} />

      {/* Talent nodes in 5-tier grid */}
      <div className={styles.nodesGrid}>
        {tree.nodes.map(node => (
          <TalentNode
            key={node.id}
            node={node}
            onInvest={() => onInvest(node.id)}
            onRemove={() => onRemove(node.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### 4.6 Offline Progress Summary Modal

**Purpose:** Welcome-back experience with animated progress reveal.

**File:** `src/renderer/components/modals/OfflineProgressModal.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { Modal } from '../shared/Modal';
import { CountUpNumber } from '../shared/CountUpNumber';
import { ItemCard } from '../shared/ItemCard';
import type { OfflineProgressState } from '@shared/types/OfflineProgress';
import styles from './OfflineProgressModal.module.css';

interface Props {
  progress: OfflineProgressState;
  onClose: () => void;
}

export const OfflineProgressModal: React.FC<Props> = ({ progress, onClose }) => {
  const [stage, setStage] = useState<'duration' | 'xp' | 'gold' | 'items' | 'complete'>('duration');

  useEffect(() => {
    const sequence = async () => {
      await delay(1000);
      setStage('xp');
      await delay(1500);
      setStage('gold');
      await delay(1500);
      setStage('items');
      await delay(2000);
      setStage('complete');
    };
    sequence();
  }, []);

  return (
    <Modal onClose={onClose} className={styles.offlineProgressModal}>
      <div className={styles.header}>
        <h2>Welcome Back!</h2>
        <p>While you were away...</p>
      </div>

      <div className={styles.content}>
        {/* Duration */}
        <div className={styles.stat}>
          <label>Time Offline:</label>
          <span className={styles.value}>{formatDuration(progress.duration)}</span>
        </div>

        {/* XP Gained (animated count-up) */}
        {stage !== 'duration' && (
          <div className={`${styles.stat} ${styles.animated}`}>
            <label>Experience Gained:</label>
            <CountUpNumber
              end={progress.xpGained}
              duration={1000}
              className={styles.xpValue}
            />
          </div>
        )}

        {/* Level Up Celebration */}
        {progress.levelsGained > 0 && stage !== 'duration' && (
          <div className={styles.levelUpBurst}>
            LEVEL UP! +{progress.levelsGained}
          </div>
        )}

        {/* Gold Gained */}
        {stage !== 'duration' && stage !== 'xp' && (
          <div className={`${styles.stat} ${styles.animated}`}>
            <label>Gold Earned:</label>
            <CountUpNumber
              end={progress.goldGained}
              duration={1000}
              className={styles.goldValue}
            />
          </div>
        )}

        {/* Items Found */}
        {stage !== 'duration' && stage !== 'xp' && stage !== 'gold' && (
          <div className={styles.itemsSection}>
            <label>Items Found:</label>
            <div className={styles.itemGrid}>
              {progress.items
                .sort((a, b) => b.quality - a.quality) // Best items first
                .map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
            </div>
          </div>
        )}
      </div>

      {stage === 'complete' && (
        <div className={styles.footer}>
          <button className={styles.equipBestButton}>Equip Best</button>
          <button className={styles.continueButton} onClick={onClose}>
            Claim & Continue
          </button>
        </div>
      )}
    </Modal>
  );
};

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 5. Shared Component Library

### 5.1 Tooltip System

**File:** `src/renderer/components/shared/TooltipOverlay.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import { useUIState } from '../../providers/UIStateProvider';
import { ItemTooltip } from './ItemTooltip';
import { TalentTooltip } from './TalentTooltip';
import { GenericTooltip } from './GenericTooltip';
import styles from './TooltipOverlay.module.css';

export const TooltipOverlay: React.FC = () => {
  const tooltip = useUIState(state => state.tooltip);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tooltip || !tooltipRef.current) return;

    // Position tooltip near cursor, but keep within viewport
    const { x, y } = tooltip.position;
    const tooltipEl = tooltipRef.current;
    const rect = tooltipEl.getBoundingClientRect();

    let left = x + 10;
    let top = y + 10;

    // Prevent overflow
    if (left + rect.width > window.innerWidth) {
      left = x - rect.width - 10;
    }
    if (top + rect.height > window.innerHeight) {
      top = y - rect.height - 10;
    }

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  }, [tooltip]);

  if (!tooltip) return null;

  return (
    <div ref={tooltipRef} className={styles.tooltipOverlay}>
      {tooltip.type === 'item' && <ItemTooltip data={tooltip.data} />}
      {tooltip.type === 'talent' && <TalentTooltip data={tooltip.data} />}
      {tooltip.type === 'generic' && <GenericTooltip data={tooltip.data} />}
    </div>
  );
};
```

**Item Tooltip:**

```typescript
// src/renderer/components/shared/ItemTooltip.tsx
import React from 'react';
import type { Item } from '@shared/types/Item';
import { useGameState } from '../../hooks/useGameState';
import { useItemComparison } from '../../hooks/useItemComparison';
import styles from './ItemTooltip.module.css';

interface Props {
  data: {
    item: Item;
    compareSlot?: string;
  };
}

export const ItemTooltip: React.FC<Props> = ({ data }) => {
  const { item, compareSlot } = data;
  const equipment = useGameState(state => state.equipment);
  const comparison = useItemComparison(item, compareSlot ? equipment.slots[compareSlot] : null);

  return (
    <div className={`${styles.itemTooltip} ${styles[`quality-${item.quality}`]}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.name}>{item.name}</div>
        <div className={styles.itemLevel}>Item Level {item.itemLevel}</div>
        <div className={styles.slot}>{item.slot} - {item.type}</div>
      </div>

      {/* Primary Stats */}
      <div className={styles.stats}>
        {item.stats.map(stat => (
          <div key={stat.type} className={styles.stat}>
            +{stat.value} {stat.type}
            {comparison && comparison[stat.type] && (
              <span className={comparison[stat.type] > 0 ? styles.increase : styles.decrease}>
                {comparison[stat.type] > 0 ? '▲' : '▼'} {Math.abs(comparison[stat.type])}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Set Bonus */}
      {item.setBonus && (
        <div className={styles.setBonus}>
          <div className={styles.setName}>◆ {item.setBonus.name} ({item.setBonus.equipped}/{item.setBonus.required})</div>
          {item.setBonus.bonuses.map((bonus, i) => (
            <div
              key={i}
              className={bonus.active ? styles.activeBonu : styles.inactiveBonus}
            >
              ({bonus.threshold}): {bonus.description}
              {bonus.active && ' ✓'}
            </div>
          ))}
        </div>
      )}

      {/* Source */}
      {item.source && (
        <div className={styles.source}>
          Drops: {item.source}
        </div>
      )}
    </div>
  );
};
```

### 5.2 Progress Bar

**File:** `src/renderer/components/shared/ProgressBar.tsx`

```typescript
import React from 'react';
import styles from './ProgressBar.module.css';

interface Props {
  current: number;
  max: number;
  label?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  showText?: boolean;
  height?: number;
}

export const ProgressBar: React.FC<Props> = ({
  current,
  max,
  label,
  color = 'blue',
  showText = true,
  height = 20
}) => {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className={styles.progressBarContainer} style={{ height }}>
      {label && <div className={styles.label}>{label}</div>}

      <div className={styles.progressBar}>
        <div
          className={`${styles.fill} ${styles[color]}`}
          style={{ width: `${percentage}%` }}
        />

        {showText && (
          <div className={styles.text}>
            {current.toLocaleString()} / {max.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 5.3 Item Slot Component

**File:** `src/renderer/components/shared/ItemSlot.tsx`

```typescript
import React, { useRef } from 'react';
import { useUIActions } from '../../providers/UIStateProvider';
import type { Item } from '@shared/types/Item';
import styles from './ItemSlot.module.css';

interface Props {
  item?: Item | null;
  slotType?: string;
  index?: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
  onClick?: () => void;
}

export const ItemSlot: React.FC<Props> = ({
  item,
  slotType,
  index,
  onDragStart,
  onDragEnd,
  onDrop,
  onClick
}) => {
  const slotRef = useRef<HTMLDivElement>(null);
  const { showTooltip, hideTooltip } = useUIActions();

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!item) return;

    showTooltip({
      type: 'item',
      data: { item, compareSlot: slotType },
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!item || !onDragStart) return;
    e.dataTransfer.effectAllowed = 'move';
    onDragStart();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop) onDrop();
  };

  return (
    <div
      ref={slotRef}
      className={`${styles.itemSlot} ${item ? styles[`quality-${item.quality}`] : ''}`}
      draggable={!!item}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={hideTooltip}
      onClick={onClick}
    >
      {item ? (
        <>
          <img src={item.icon} alt={item.name} className={styles.icon} />
          {item.quantity > 1 && (
            <span className={styles.quantity}>{item.quantity}</span>
          )}
        </>
      ) : (
        <div className={styles.emptySlot}>
          {slotType && <img src={`/assets/slots/${slotType}.png`} alt={slotType} />}
        </div>
      )}
    </div>
  );
};
```

### 5.4 Button Variants

**File:** `src/renderer/components/shared/Button.tsx`

```typescript
import React from 'react';
import styles from './Button.module.css';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export const Button: React.FC<Props> = ({
  variant = 'primary',
  size = 'medium',
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

### 5.5 Modal System

**File:** `src/renderer/components/shared/Modal.tsx`

```typescript
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.css';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<Props> = ({
  children,
  onClose,
  className,
  showCloseButton = true
}) => {
  useEffect(() => {
    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${className || ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        )}
        {children}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
```

### 5.6 Combat Log Entry

**File:** `src/renderer/components/combat/CombatLogEntry.tsx`

```typescript
import React from 'react';
import type { CombatLogEntry as LogEntry } from '@shared/types/Combat';
import styles from './CombatLogEntry.module.css';

interface Props {
  entry: LogEntry;
}

export const CombatLogEntry: React.FC<Props> = ({ entry }) => {
  const colorClass = getColorForType(entry.type);

  return (
    <div className={`${styles.logEntry} ${styles[colorClass]}`}>
      <span className={styles.timestamp}>
        {formatTimestamp(entry.timestamp)}
      </span>
      <span className={styles.message}>
        {entry.message}
      </span>
    </div>
  );
};

function getColorForType(type: string): string {
  const colorMap: Record<string, string> = {
    'auto-attack': 'white',
    'ability': 'yellow',
    'damage-taken': 'red',
    'healing': 'green',
    'mana': 'blue',
    'loot-epic': 'purple',
    'loot-legendary': 'orange',
    'system': 'gray'
  };
  return colorMap[type] || 'white';
}

function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleTimeString('en-US', { hour12: false });
}
```

---

## 6. CSS/Styling Strategy

### 6.1 Theme Variables

**File:** `src/renderer/styles/global/theme.css`

```css
:root {
  /* Colors - Dark MMORPG Palette */
  --bg-primary: #1a1410;
  --bg-secondary: #2a1f18;
  --bg-tertiary: #3a2a20;

  --border-primary: #8b6f47;
  --border-secondary: #6a5435;
  --border-accent: #d4af37;

  --text-primary: #f4e4c1;
  --text-secondary: #c4b494;
  --text-muted: #8a7a5a;

  --accent-gold: #d4af37;
  --accent-bronze: #cd7f32;

  /* Item Quality Colors */
  --quality-common: #9d9d9d;
  --quality-uncommon: #1eff00;
  --quality-rare: #0070dd;
  --quality-epic: #a335ee;
  --quality-legendary: #ff8000;

  /* Stat Colors */
  --stat-increase: #2ecc71;
  --stat-decrease: #e74c3c;

  /* HP/Mana Colors */
  --hp-color: #c41e3a;
  --mana-color: #0070dd;
  --energy-color: #ffd700;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px rgba(212, 175, 55, 0.5);

  /* Typography */
  --font-primary: 'Cinzel', serif;
  --font-secondary: 'Lato', sans-serif;

  --font-size-xs: 10px;
  --font-size-sm: 12px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-xxl: 24px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;
}
```

### 6.2 Global Styles

**File:** `src/renderer/styles/global/reset.css`

```css
/* Modern CSS Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-secondary);
  font-size: var(--font-size-md);
  color: var(--text-primary);
  background: var(--bg-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
}

img {
  display: block;
  max-width: 100%;
}

input, select, textarea {
  font-family: inherit;
  font-size: inherit;
}

/* Custom Scrollbar (Chromium) */
::-webkit-scrollbar {
  width: 12px;
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: var(--radius-sm);
  border: 2px solid var(--bg-secondary);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-accent);
}
```

### 6.3 Typography

**File:** `src/renderer/styles/global/typography.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-primary);
  font-weight: 600;
  line-height: 1.2;
  color: var(--accent-gold);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

h1 { font-size: var(--font-size-xxl); }
h2 { font-size: var(--font-size-xl); }
h3 { font-size: var(--font-size-lg); }

.text-quality-common { color: var(--quality-common); }
.text-quality-uncommon { color: var(--quality-uncommon); }
.text-quality-rare { color: var(--quality-rare); }
.text-quality-epic { color: var(--quality-epic); }
.text-quality-legendary { color: var(--quality-legendary); }

.text-increase { color: var(--stat-increase); }
.text-decrease { color: var(--stat-decrease); }
```

### 6.4 Ornate UI Chrome

**Example:** Panel with ornate border

```css
/* Panel.module.css */
.panel {
  background: var(--bg-secondary);
  border: 3px solid transparent;
  border-image: url('/assets/ui/border-ornate.png') 30 round;
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md), inset 0 0 30px rgba(0, 0, 0, 0.5);
  position: relative;
}

.panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('/assets/ui/parchment-texture.png');
  opacity: 0.1;
  pointer-events: none;
  border-radius: var(--radius-md);
}

.panelHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--border-primary);
}
```

### 6.5 Button Styles

**File:** `src/renderer/components/shared/Button.module.css`

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-family: var(--font-primary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left var(--transition-normal);
}

.button:hover::before {
  left: 100%;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.primary {
  background: linear-gradient(180deg, #d4af37 0%, #a68425 100%);
  color: #1a1410;
  border: 2px solid #f4e4c1;
}

.primary:hover:not(:disabled) {
  background: linear-gradient(180deg, #f4e4c1 0%, #d4af37 100%);
  box-shadow: var(--shadow-glow);
}

.secondary {
  background: linear-gradient(180deg, #6a5435 0%, #4a3a25 100%);
  color: var(--text-primary);
  border: 2px solid var(--border-primary);
}

.secondary:hover:not(:disabled) {
  background: linear-gradient(180deg, #8b6f47 0%, #6a5435 100%);
}

.danger {
  background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: 2px solid #ff6b5a;
}

/* Sizes */
.small { padding: 4px 12px; font-size: var(--font-size-sm); }
.medium { padding: 8px 20px; font-size: var(--font-size-md); }
.large { padding: 12px 28px; font-size: var(--font-size-lg); }
```

### 6.6 Responsive Layout

**Minimum window size:** 1280×720

```css
/* Fluid scaling for larger windows */
@media (min-width: 1920px) {
  :root {
    --font-size-md: 16px;
    --spacing-md: 20px;
  }
}

/* Collapsible side panels for smaller windows */
@media (max-width: 1280px) {
  .sidePanel {
    position: absolute;
    left: -300px;
    transition: left var(--transition-normal);
  }

  .sidePanel.expanded {
    left: 0;
    z-index: 100;
    box-shadow: var(--shadow-lg);
  }
}
```

### 6.7 Animation Examples

**Item Quality Glow:**

```css
@keyframes quality-glow {
  0%, 100% { box-shadow: 0 0 10px currentColor; }
  50% { box-shadow: 0 0 20px currentColor; }
}

.item-quality-legendary {
  animation: quality-glow 2s ease-in-out infinite;
}
```

**Level Up Burst:**

```css
@keyframes level-up-burst {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}

.levelUpBurst {
  animation: level-up-burst 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

**Count-Up Number:**

```css
.countUpNumber {
  display: inline-block;
  animation: count-pulse 0.3s ease;
}

@keyframes count-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); color: var(--accent-gold); }
  100% { transform: scale(1); }
}
```

---

## 7. Performance Optimizations

### 7.1 Combat Log Virtualization

**File:** `src/renderer/components/combat/CombatLog.tsx`

```typescript
import React, { useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { CombatLogEntry } from './CombatLogEntry';
import { useGameState } from '../../hooks/useGameState';
import styles from './CombatLog.module.css';

export const CombatLog: React.FC = () => {
  const logEntries = useGameState(state => state.combat.log);
  const listRef = useRef<List>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollToItem(logEntries.length - 1);
    }
  }, [logEntries.length, autoScroll]);

  const Row = ({ index, style }: any) => (
    <div style={style}>
      <CombatLogEntry entry={logEntries[index]} />
    </div>
  );

  return (
    <div className={styles.combatLog}>
      <div className={styles.header}>
        <h3>Combat Log</h3>
        <button
          className={styles.autoScrollToggle}
          onClick={() => setAutoScroll(!autoScroll)}
        >
          {autoScroll ? '🔒 Locked' : '🔓 Unlocked'}
        </button>
      </div>

      <List
        ref={listRef}
        height={400}
        itemCount={logEntries.length}
        itemSize={24}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
};
```

### 7.2 Lazy Loading Tabs

```typescript
// src/renderer/components/layout/TabContent.tsx
import React, { lazy, Suspense } from 'react';
import { useUIState } from '../../providers/UIStateProvider';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const CharacterTab = lazy(() => import('../character/CharacterTab'));
const InventoryTab = lazy(() => import('../inventory/InventoryTab'));
const TalentsTab = lazy(() => import('../talents/TalentsTab'));
const ProfessionsTab = lazy(() => import('../professions/ProfessionsTab'));
const AchievementsTab = lazy(() => import('../achievements/AchievementsTab'));

export const TabContent: React.FC = () => {
  const activeTab = useUIState(state => state.activeTab);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {activeTab === 'character' && <CharacterTab />}
      {activeTab === 'inventory' && <InventoryTab />}
      {activeTab === 'talents' && <TalentsTab />}
      {activeTab === 'professions' && <ProfessionsTab />}
      {activeTab === 'achievements' && <AchievementsTab />}
    </Suspense>
  );
};
```

### 7.3 Memoized Components

```typescript
// Memoize expensive stat calculations
export const StatPanel: React.FC<Props> = React.memo(({ character, equipment }) => {
  const derivedStats = useMemo(() => {
    return calculateDerivedStats(character, equipment);
  }, [character.level, character.baseStats, equipment]);

  return (
    <div className={styles.statPanel}>
      {/* Render derived stats */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if specific fields changed
  return (
    prevProps.character.level === nextProps.character.level &&
    prevProps.character.baseStats === nextProps.character.baseStats &&
    shallowEqual(prevProps.equipment.slots, nextProps.equipment.slots)
  );
});
```

### 7.4 Throttled State Updates

```typescript
// src/renderer/hooks/useThrottledGameState.ts
import { useEffect, useState } from 'react';
import { useGameState } from './useGameState';

/**
 * Throttle fast-changing game state (like DPS meter) to reduce re-renders.
 */
export function useThrottledGameState<T>(
  selector: (state: GameState) => T,
  throttleMs: number = 500
): T {
  const rawValue = useGameState(selector);
  const [throttledValue, setThrottledValue] = useState<T>(rawValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setThrottledValue(rawValue);
    }, throttleMs);

    return () => clearTimeout(timer);
  }, [rawValue, throttleMs]);

  return throttledValue;
}

// Usage:
const dps = useThrottledGameState(state => state.combat.dps, 500);
```

### 7.5 Canvas for Sprite Rendering (Phase 2)

```typescript
// src/renderer/components/combat/CombatCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { useGameState } from '../../hooks/useGameState';

export const CombatCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const combatState = useGameState(state => state.combat);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    let animationFrame: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render player sprite
      if (combatState.playerSprite) {
        ctx.drawImage(
          combatState.playerSprite.image,
          combatState.playerSprite.x,
          combatState.playerSprite.y
        );
      }

      // Render enemy sprite
      if (combatState.enemySprite) {
        ctx.drawImage(
          combatState.enemySprite.image,
          combatState.enemySprite.x,
          combatState.enemySprite.y
        );
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrame);
  }, [combatState]);

  return <canvas ref={canvasRef} width={800} height={600} />;
};
```

---

## 8. Key Hooks Design

### 8.1 useGameState (Covered in Section 3.3)

```typescript
export function useGameState<T>(selector: (state: GameState) => T): T;
```

### 8.2 useTooltip

**File:** `src/renderer/hooks/useTooltip.ts`

```typescript
import { useCallback } from 'react';
import { useUIActions } from '../providers/UIStateProvider';
import type { TooltipData } from '../types/UIState';

export function useTooltip() {
  const { showTooltip, hideTooltip } = useUIActions();

  const show = useCallback((data: TooltipData, event: React.MouseEvent) => {
    showTooltip({
      ...data,
      position: { x: event.clientX, y: event.clientY }
    });
  }, [showTooltip]);

  const hide = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  return { show, hide };
}

// Usage:
const tooltip = useTooltip();

<div
  onMouseEnter={(e) => tooltip.show({ type: 'item', data: { item } }, e)}
  onMouseLeave={tooltip.hide}
>
  Item Slot
</div>
```

### 8.3 useDragDrop

**File:** `src/renderer/hooks/useDragDrop.ts`

```typescript
import { useCallback } from 'react';
import { useUIActions, useUIState } from '../providers/UIStateProvider';
import type { InventorySlot } from '@shared/types/Inventory';

export function useDragDrop() {
  const { startDrag, endDrag } = useUIActions();
  const draggedItem = useUIState(state => state.draggedItem);

  const handleDragStart = useCallback((slot: InventorySlot) => {
    if (!slot.item) return;
    startDrag({ slot });
  }, [startDrag]);

  const handleDragEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleDrop = useCallback((targetSlot: number) => {
    if (!draggedItem) return;

    // Send swap action to engine
    window.gameAPI.send('inventory-swap', {
      fromSlot: draggedItem.slot.index,
      toSlot: targetSlot
    });

    endDrag();
  }, [draggedItem, endDrag]);

  return {
    draggedItem,
    startDrag: handleDragStart,
    endDrag: handleDragEnd,
    handleDrop
  };
}
```

### 8.4 useItemComparison

**File:** `src/renderer/hooks/useItemComparison.ts`

```typescript
import { useMemo } from 'react';
import type { Item } from '@shared/types/Item';

interface StatComparison {
  [statType: string]: number; // Positive = upgrade, negative = downgrade
}

export function useItemComparison(
  newItem: Item,
  equippedItem: Item | null
): StatComparison | null {
  return useMemo(() => {
    if (!equippedItem) return null;

    const comparison: StatComparison = {};

    // Compare primary stats
    for (const newStat of newItem.stats) {
      const equippedStat = equippedItem.stats.find(s => s.type === newStat.type);
      comparison[newStat.type] = newStat.value - (equippedStat?.value || 0);
    }

    // Stats removed (in equipped but not in new)
    for (const equippedStat of equippedItem.stats) {
      if (!newItem.stats.find(s => s.type === equippedStat.type)) {
        comparison[equippedStat.type] = -equippedStat.value;
      }
    }

    return comparison;
  }, [newItem, equippedItem]);
}
```

### 8.5 useKeyboardShortcuts

**File:** `src/renderer/hooks/useKeyboardShortcuts.ts`

```typescript
import { useEffect } from 'react';
import { useUIActions } from '../providers/UIStateProvider';

export function useKeyboardShortcuts() {
  const { setActiveTab } = useUIActions();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab navigation (C for Character, I for Inventory, etc.)
      if (e.key === 'c' && !e.ctrlKey) {
        setActiveTab('character');
      } else if (e.key === 'i' && !e.ctrlKey) {
        setActiveTab('inventory');
      } else if (e.key === 't' && !e.ctrlKey) {
        setActiveTab('talents');
      } else if (e.key === 'p' && !e.ctrlKey) {
        setActiveTab('professions');
      }

      // Close modal on Escape (handled in Modal component)
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);
}
```

---

## 9. IPC Integration Layer

### 9.1 Preload Script (Bridge)

**File:** `src/main/preload.ts`

```typescript
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('gameAPI', {
  // Send action to engine
  send: (channel: string, data?: any) => {
    ipcRenderer.send('game-action', { channel, data });
  },

  // Listen for engine updates
  on: (channel: string, callback: (data: any) => void) => {
    const subscription = (_event: IpcRendererEvent, data: any) => {
      if (data.channel === channel) {
        callback(data.payload);
      }
    };
    ipcRenderer.on('game-update', subscription);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('game-update', subscription);
    };
  },

  // One-time listener
  once: (channel: string, callback: (data: any) => void) => {
    const subscription = (_event: IpcRendererEvent, data: any) => {
      if (data.channel === channel) {
        callback(data.payload);
        ipcRenderer.removeListener('game-update', subscription);
      }
    };
    ipcRenderer.on('game-update', subscription);
  },

  // Initialize
  initialize: () => {
    ipcRenderer.send('renderer-ready');
  }
});

// TypeScript declaration
declare global {
  interface Window {
    gameAPI: {
      send: (channel: string, data?: any) => void;
      on: (channel: string, callback: (data: any) => void) => () => void;
      once: (channel: string, callback: (data: any) => void) => void;
      initialize: () => void;
    };
  }
}
```

### 9.2 IPC Channel Definitions

**File:** `src/shared/types/IPC.ts`

```typescript
// Renderer → Engine (Actions)
export type GameAction =
  | { type: 'create-character'; payload: CreateCharacterPayload }
  | { type: 'equip-item'; payload: { itemId: string; slot: string } }
  | { type: 'inventory-swap'; payload: { fromSlot: number; toSlot: number } }
  | { type: 'talent-invest'; payload: { nodeId: string } }
  | { type: 'talent-remove'; payload: { nodeId: string } }
  | { type: 'talent-respec'; payload: {} }
  | { type: 'quest-accept'; payload: { questId: string } }
  | { type: 'quest-abandon'; payload: { questId: string } }
  | { type: 'dungeon-start'; payload: { dungeonId: string } }
  | { type: 'profession-craft'; payload: { recipeId: string; quantity: number } }
  | { type: 'request-initial-state'; payload: {} };

// Engine → Renderer (Updates)
export type GameUpdate =
  | { type: 'game-state-update'; payload: Partial<GameState> }
  | { type: 'initial-state'; payload: InitialStatePayload }
  | { type: 'character-created'; payload: { characterId: string } }
  | { type: 'combat-log'; payload: { entry: CombatLogEntry } }
  | { type: 'level-up'; payload: { newLevel: number } }
  | { type: 'item-looted'; payload: { item: Item } }
  | { type: 'achievement-unlocked'; payload: { achievementId: string } }
  | { type: 'error'; payload: { message: string } };
```

### 9.3 Action Dispatcher

**File:** `src/renderer/utils/actionDispatcher.ts`

```typescript
import type { GameAction } from '@shared/types/IPC';

export function dispatchGameAction<T extends GameAction['type']>(
  type: T,
  payload: Extract<GameAction, { type: T }>['payload']
): void {
  window.gameAPI.send('game-action', { type, payload });
}

// Usage:
dispatchGameAction('equip-item', { itemId: 'item_123', slot: 'head' });
dispatchGameAction('talent-invest', { nodeId: 'talent_fireball_1' });
```

### 9.4 State Sync Flow

```
User clicks "Equip" on an item
    ↓
React event handler calls dispatchGameAction('equip-item', {...})
    ↓
Preload bridge sends IPC to main process
    ↓
Main process forwards to engine worker
    ↓
Engine validates and applies change
    ↓
Engine emits 'game-state-update' with new equipment state
    ↓
Main process forwards update to renderer via IPC
    ↓
GameStateProvider receives update and calls dispatch
    ↓
useGameState subscribers detect change (selector-based)
    ↓
Only affected components re-render (e.g., PaperDoll, StatPanel)
    ↓
UI reflects new equipped item
```

### 9.5 Error Handling

```typescript
// Listen for errors from engine
useEffect(() => {
  const unsubscribe = window.gameAPI.on('error', (data) => {
    console.error('Game Error:', data.message);

    // Show error toast/modal
    showNotification({
      type: 'error',
      message: data.message,
      duration: 5000
    });
  });

  return unsubscribe;
}, []);
```

---

## 10. File Structure

```
src/renderer/
├── index.tsx                     # App entry point
├── App.tsx                       # Root component
├── types/
│   ├── UIState.ts               # UI-specific types
│   └── index.ts
├── providers/
│   ├── GameStateProvider.tsx    # Game state context
│   └── UIStateProvider.tsx      # UI state context
├── hooks/
│   ├── useGameState.ts          # Selector-based game state hook
│   ├── useThrottledGameState.ts # Throttled version for fast updates
│   ├── useTooltip.ts            # Tooltip management
│   ├── useDragDrop.ts           # Drag-and-drop logic
│   ├── useItemComparison.ts     # Gear comparison logic
│   ├── useKeyboardShortcuts.ts  # Global keyboard shortcuts
│   └── index.ts
├── components/
│   ├── character-creation/
│   │   ├── CharacterCreationScreen.tsx
│   │   ├── CharacterCreationScreen.module.css
│   │   ├── RacePicker.tsx
│   │   ├── ClassPicker.tsx
│   │   ├── NameInput.tsx
│   │   ├── StatPreview.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── MainGameScreen.tsx
│   │   ├── MainGameScreen.module.css
│   │   ├── TopBar.tsx
│   │   ├── SidePanel.tsx
│   │   ├── NavigationTabs.tsx
│   │   ├── StatusBar.tsx
│   │   ├── TabContent.tsx
│   │   └── index.ts
│   ├── character/
│   │   ├── CharacterTab.tsx
│   │   ├── PaperDoll.tsx
│   │   ├── PaperDoll.module.css
│   │   ├── GearSlot.tsx
│   │   ├── StatPanel.tsx
│   │   ├── BuffBar.tsx
│   │   └── index.ts
│   ├── inventory/
│   │   ├── InventoryTab.tsx
│   │   ├── BagGrid.tsx
│   │   ├── BagGrid.module.css
│   │   └── index.ts
│   ├── talents/
│   │   ├── TalentsTab.tsx
│   │   ├── TalentTree.tsx
│   │   ├── TalentTree.module.css
│   │   ├── TalentNode.tsx
│   │   ├── TalentConnections.tsx
│   │   └── index.ts
│   ├── combat/
│   │   ├── CombatLog.tsx
│   │   ├── CombatLog.module.css
│   │   ├── CombatLogEntry.tsx
│   │   ├── DPSMeter.tsx
│   │   └── index.ts
│   ├── quests/
│   │   ├── QuestsTab.tsx
│   │   ├── QuestTracker.tsx
│   │   ├── QuestJournal.tsx
│   │   └── index.ts
│   ├── dungeons/
│   │   ├── DungeonsTab.tsx
│   │   ├── DungeonBrowser.tsx
│   │   ├── LootPreview.tsx
│   │   └── index.ts
│   ├── professions/
│   │   ├── ProfessionsTab.tsx
│   │   ├── CraftingGrid.tsx
│   │   ├── RecipeList.tsx
│   │   └── index.ts
│   ├── achievements/
│   │   ├── AchievementsTab.tsx
│   │   ├── CategoryPanel.tsx
│   │   └── index.ts
│   ├── modals/
│   │   ├── OfflineProgressModal.tsx
│   │   ├── OfflineProgressModal.module.css
│   │   └── index.ts
│   └── shared/
│       ├── Button.tsx
│       ├── Button.module.css
│       ├── Modal.tsx
│       ├── Modal.module.css
│       ├── Tooltip.tsx
│       ├── TooltipOverlay.tsx
│       ├── ItemTooltip.tsx
│       ├── ItemTooltip.module.css
│       ├── TalentTooltip.tsx
│       ├── GenericTooltip.tsx
│       ├── ProgressBar.tsx
│       ├── ProgressBar.module.css
│       ├── ItemSlot.tsx
│       ├── ItemSlot.module.css
│       ├── ItemCard.tsx
│       ├── LoadingScreen.tsx
│       ├── LoadingSpinner.tsx
│       ├── CountUpNumber.tsx
│       ├── ModalStack.tsx
│       └── index.ts
├── styles/
│   ├── global/
│   │   ├── reset.css
│   │   ├── theme.css
│   │   └── typography.css
│   └── utils/
│       └── helpers.css           # Utility classes (.text-center, .mt-4, etc.)
├── assets/
│   ├── icons/                    # Item, ability, buff/debuff icons
│   ├── ui/                       # Borders, backgrounds, textures
│   ├── sprites/                  # Character and monster sprites (Phase 2)
│   └── fonts/                    # Custom fonts (if not from CDN)
└── utils/
    ├── formatting.ts             # Number formatting (1.2K, 3.5M), time display
    ├── comparison.ts             # Gear stat comparison logic
    ├── actionDispatcher.ts       # IPC action helpers
    └── index.ts
```

---

## Next Steps

### Phase 1 Implementation Order

1. **Foundation (Week 1)**
   - Set up Vite + React + TypeScript
   - Implement theme system (CSS variables)
   - Build shared component library (Button, Modal, ProgressBar, ItemSlot)
   - Set up GameStateProvider and UIStateProvider

2. **Core Screens (Weeks 2-3)**
   - Character Creation screen
   - Main Hub layout structure
   - Character/Equipment screen with paper doll
   - Inventory screen with drag-and-drop

3. **Advanced Screens (Weeks 4-5)**
   - Talent tree visualization
   - Combat log with virtualization
   - Quest tracker and journal
   - Offline progress modal

4. **Polish (Week 6)**
   - Tooltip system refinement
   - Animations and transitions
   - Keyboard shortcuts
   - Accessibility pass

### Integration Checkpoints

- [ ] IPC communication tested between renderer and mock engine
- [ ] State updates trigger correct component re-renders
- [ ] Drag-and-drop inventory works smoothly
- [ ] Tooltips position correctly at viewport edges
- [ ] Combat log handles 10,000+ entries without lag
- [ ] Tab switching is instant (< 100ms)
- [ ] Visual design matches MMORPG aesthetic (ornate, dark, gold accents)

---

**Document End**

This architecture document serves as the complete blueprint for the frontend implementation. All component patterns, state management strategies, styling conventions, and performance optimizations are defined here. Implementation should follow this structure closely, with any deviations documented and justified.

For questions or clarifications, coordinate with:
- **@idle-mmo-gdev** for game state interfaces and IPC protocols
- **@idle-mmo-ui-designer** for visual specs and interaction design
- **@idle-mmo-gpm** for feature requirements and acceptance criteria
