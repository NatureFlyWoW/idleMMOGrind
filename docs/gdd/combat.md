# Combat System

Automated combat loop, stats, damage and healing formulas, ability types, and resource management.

## Automated Combat Loop

Combat is fully automated but influenced by player build choices:

1. Character auto-attacks current target
2. Abilities fire based on priority system and resource availability
3. Damage/healing calculated using MMORPG-style formulas
4. Loot rolled upon enemy defeat
5. Next target auto-selected from available monsters

## Primary Stats

Five primary stats govern character performance:

| Stat | Effects |
|------|---------|
| Strength (STR) | Physical damage, carry capacity |
| Agility (AGI) | Critical chance, dodge, ranged damage |
| Intellect (INT) | Spell power, mana pool |
| Spirit (SPI) | Mana regen, health regen |
| Stamina (STA) | Health pool, survivability |

## Secondary Stats

Secondary stats derived from gear and talents:

- Critical Strike Chance / Damage
- Haste (attack/cast speed)
- Armor / Resistance
- Hit Rating (accuracy)
- Expertise (parry/dodge reduction)
- Spell Penetration

## Damage and Healing Formulas

**Physical Damage:**

```
Physical Damage = (Weapon Damage + STR modifier) x (1 + Critical multiplier) x (1 - Enemy Armor reduction)
```

**Spell Damage:**

```
Spell Damage = (Base Spell + INT modifier) x (1 + Critical multiplier) x (1 - Enemy Resistance)
```

**Healing:**

```
Healing = (Base Heal + INT modifier) x (1 + Critical multiplier)
```

## Ability Types

1. **Direct Damage** -- Instant damage (e.g., Flamebolt, Shadow Strike)
2. **Damage Over Time (DoT)** -- Periodic damage (e.g., Plaguetouch, Rending Slash)
3. **Area of Effect (AoE)** -- Multiple target damage (e.g., Frostfall, Blade Tempest)
4. **Heal Over Time (HoT)** -- Periodic healing (e.g., Wildgrowth, Restoration Aura)
5. **Direct Healing** -- Instant healing (e.g., Rapid Mend, Divine Touch)
6. **Buffs** -- Temporary stat increases (e.g., Empowering Word, Sentinel's Blessing)
7. **Debuffs** -- Enemy weakening (e.g., Hex of Weakness, Armor Breach)
8. **Crowd Control** -- Disable enemies (e.g., Transfigure, Silence Strike)

## Ability Acquisition

- Core abilities unlock at specific levels (e.g., Fireball at 1, Frostbolt at 4)
- Specialization abilities unlock through talent investment
- Ability ranks purchasable from class trainers using gold
- Higher ranks increase damage/healing and reduce cast time

## Resource Management

Each class uses specific resources:

| Resource | Classes |
|----------|---------|
| Mana | Arcanist, Cleric, Summoner, Channeler, Shapeshifter, Sentinel |
| Energy | Shadow, Shapeshifter (Primal) |
| Rage | Blademaster, Shapeshifter (Primal) |
| Soul Power | Reaper (future expansion) |

Resources regenerate automatically with rates modified by Spirit and other stats.

## Appendix A: Sample Combat Calculations

**Example: Level 60 Pyromancy Arcanist vs Raid Boss**

Character Stats:
- Intellect: 500 (from gear and talents)
- Spell Power: 850
- Critical Strike Chance: 25%
- Haste: 15%

Flamebolt Cast:
- Base Damage: 800-900
- INT Modifier: +500 damage
- Spell Power Modifier: +850 damage
- Total Non-Crit: 2150-2250 damage
- Critical Hit (25% chance): 3225-3375 damage
- Cast Time: 2.5s reduced by 15% haste = 2.125s
- DPS: ~1035 average
