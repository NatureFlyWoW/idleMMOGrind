# Phase 2 -- UI Screens (Tasks U1-U6)

> Part of the [Phase 2 Implementation Plan](plan-index.md) | **Status:** Pending
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Branch:** `feat/phase2-ui`
**Worktree:** `C:\Users\Caus\Desktop\idleMMOGrind-worktrees\feat-phase2-ui\`
**Depends on:** All Wave 1-3 engine branches merged to main

---

## Task U1 -- Quest Journal Upgrade

**Goal:** Replace Phase 1's simple quest display with a full quest journal showing active chains, objectives, and completion status.

### Step U1.1 -- Write QuestJournal component

**File:** `src/renderer/components/quest-journal/QuestJournal.tsx`

Features:
- Left panel: list of quest chains per zone (grouped by zone)
- Right panel: selected chain's quests with objective progress
- Chain status indicators: in-progress, completed, locked
- Active quest objectives with kill/collect counters
- Chain completion rewards preview
- Zone filter tabs

### Step U1.2 -- Write CSS module

**File:** `src/renderer/components/quest-journal/QuestJournal.module.css`

### Step U1.3 -- Write component tests

**File:** `tests/unit/renderer/quest-journal.test.ts` (React Testing Library)

### Step U1.4 -- Commit

Commit: `feat(ui): add quest journal with chain tracking and objective display`

---

## Task U2 -- Dungeon Browser

**Goal:** Build the dungeon browser screen where players view available dungeons, success previews, and run history.

### Step U2.1 -- Write DungeonBrowser component

**File:** `src/renderer/components/dungeons/DungeonBrowser.tsx`

Features:
- List of all dungeons with level range, boss count, lock status
- Normal/Heroic difficulty toggle
- Success preview per boss (estimated success chance before running)
- Run button (sends IPC message to engine)
- Active lockout display (heroic daily timer)
- Recent run results panel with loot summary
- Boss mechanic type icons (high_damage, magic_heavy, etc.)

### Step U2.2 -- Write DungeonRunResult component

**File:** `src/renderer/components/dungeons/DungeonRunResult.tsx`

Modal showing per-boss results: success/fail, loot dropped, XP/gold/rep earned.

### Step U2.3 -- Write CSS modules and tests

### Step U2.4 -- Commit

Commit: `feat(ui): add dungeon browser with success preview and run results`

---

## Task U3 -- Raid Planner

**Goal:** Build the raid planner screen with attunement tracking, party info, and tier set progress.

### Step U3.1 -- Write RaidPlanner component

**File:** `src/renderer/components/raids/RaidPlanner.tsx`

Features:
- Raid list with attunement status per raid
- Attunement quest chain progress display
- Boss list with weekly progress (defeated/available)
- Party modifier display (flat bonus based on role)
- Tier set collection progress (X/5 pieces, active bonuses)
- Run button with weekly lockout status
- Bonus roll option per boss

### Step U3.2 -- Write TierSetDisplay component

**File:** `src/renderer/components/raids/TierSetDisplay.tsx`

Shows equipped tier pieces, active bonuses (2/4-piece), and missing pieces.

### Step U3.3 -- Write CSS modules and tests

### Step U3.4 -- Commit

Commit: `feat(ui): add raid planner with attunement tracking and tier set display`

---

## Task U4 -- Profession Panel

**Goal:** Build the profession management screen with gathering/crafting displays.

### Step U4.1 -- Write ProfessionPanel component

**File:** `src/renderer/components/professions/ProfessionPanel.tsx`

Features:
- Primary profession slots (2) with skill bars
- Secondary professions (3) with skill bars
- Learn/unlearn profession interface
- Gathering rate display (materials/minute)
- Material bank grid (100 slots, material icons, quantities)

### Step U4.2 -- Write CraftingQueue component

**File:** `src/renderer/components/professions/CraftingQueue.tsx`

Features:
- Recipe list filtered by profession, searchable
- Recipe difficulty color (orange/yellow/green/gray)
- Material requirements with have/need counts
- Queue display (up to 10 items)
- Add to queue / cancel buttons
- Craft progress timer

### Step U4.3 -- Write RecipeTooltip component

**File:** `src/renderer/components/professions/RecipeTooltip.tsx`

Hover tooltip showing recipe details, materials needed, output preview.

### Step U4.4 -- Write CSS modules and tests

### Step U4.5 -- Commit

Commit: `feat(ui): add profession panel with crafting queue and recipe browser`

---

## Task U5 -- Reputation Panel & Vendor Screen

**Goal:** Build the reputation tracker display and vendor purchase interface.

### Step U5.1 -- Write ReputationPanel component

**File:** `src/renderer/components/reputation/ReputationPanel.tsx`

Features:
- Faction list with reputation bars (progress within tier)
- Tier labels: Neutral/Friendly/Honored/Revered/Exalted
- Equipped tabard indicator
- Tabard equip/swap UI
- Faction details: zone, description, vendor preview
- Daily quest list with completion status

### Step U5.2 -- Write VendorScreen component

**File:** `src/renderer/components/reputation/VendorScreen.tsx`

Features:
- Vendor inventory grid filtered by reputation tier
- Items greyed out if tier not reached
- Purchase button with currency cost display
- Currency balance header (gold, justice, valor)
- Item tooltips with stat comparison to equipped gear

### Step U5.3 -- Write CSS modules and tests

### Step U5.4 -- Commit

Commit: `feat(ui): add reputation panel with vendor screen and tabard management`

---

## Task U6 -- Game State Snapshot Extensions & Tab Integration

**Goal:** Extend the game state snapshot to include all Phase 2 data and add new tabs to the main hub.

### Step U6.1 -- Extend IGameStateSnapshot

Add to `src/shared/types/state.ts`:

```typescript
// Phase 2 additions
questChains: IQuestChainProgress[];
dungeonState: ISaveDungeonState;
raidState: ISaveRaidState;
professionState: { primary: IProfessionState[]; secondary: IProfessionState[]; materialBank: IMaterialBankEntry[] };
reputationState: ISaveReputationState;
dailyWeeklyState: ISaveDailyWeeklyState;
activeZoneEvents: IActiveZoneEvent[];
```

### Step U6.2 -- Add new tabs to MainHub

Modify `src/renderer/components/main-hub/MainHub.tsx`:
- Add tabs: Quests, Dungeons, Raids, Professions, Reputation
- Lazy-load new screens for performance
- Tab order: Overview, Character, Inventory, Quests, Dungeons, Raids, Professions, Reputation, Settings

### Step U6.3 -- Update renderer context

Add Phase 2 state to the React context so all new components can consume it.

### Step U6.4 -- Run full test suite, commit

Commit: `feat(ui): extend game state snapshot and add Phase 2 tabs to main hub`
