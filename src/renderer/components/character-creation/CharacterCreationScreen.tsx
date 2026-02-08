import React, { useState, useMemo } from 'react';
import { Panel } from '../shared/Panel';
import { Button } from '../shared/Button';
import styles from './CharacterCreationScreen.module.css';
import type { IRaceDefinition, IClassDefinition } from '@shared/types/character';

// Import static data for display (typed via resolveJsonModule)
import racesData from '@data/races.json';
import classesData from '@data/classes.json';

// Cast JSON imports to their proper interface types
const races = racesData as unknown as IRaceDefinition[];
const classes = classesData as unknown as IClassDefinition[];

interface Props {
  onComplete: (params: { name: string; race: string; classId: string }) => void;
}

export const CharacterCreationScreen: React.FC<Props> = ({ onComplete }) => {
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedRaceData = useMemo(
    () => races.find((r) => r.id === selectedRace) ?? null,
    [selectedRace],
  );

  const selectedClassData = useMemo(
    () => classes.find((c) => c.id === selectedClass) ?? null,
    [selectedClass],
  );

  const isNameValid = characterName.trim().length >= 2
    && characterName.trim().length <= 16
    && /^[A-Za-z][A-Za-z'-]*$/.test(characterName.trim());

  const canCreate = selectedRace !== null && selectedClass !== null && isNameValid;

  const handleCreate = () => {
    if (!canCreate || isCreating || selectedRace === null || selectedClass === null) return;
    setIsCreating(true);
    onComplete({
      name: characterName.trim(),
      race: selectedRace,
      classId: selectedClass,
    });
  };

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Create Your Hero</h1>

      <div className={styles.content}>
        <Panel className={styles.racePanel}>
          <h2 className={styles.sectionTitle}>Choose Race</h2>
          <div className={styles.optionGrid} role="radiogroup" aria-label="Race selection">
            {races.map((race) => (
              <button
                key={race.id}
                className={`${styles.optionCard} ${selectedRace === race.id ? styles.selected : ''}`}
                onClick={() => setSelectedRace(race.id)}
                role="radio"
                aria-checked={selectedRace === race.id}
                aria-label={race.name}
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
          <div className={styles.optionGrid} role="radiogroup" aria-label="Class selection">
            {classes.map((cls) => (
              <button
                key={cls.id}
                className={`${styles.optionCard} ${selectedClass === cls.id ? styles.selected : ''}`}
                onClick={() => setSelectedClass(cls.id)}
                role="radio"
                aria-checked={selectedClass === cls.id}
                aria-label={cls.name}
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
                {selectedClassData.specs.map((spec) => (
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
            aria-label="Character name"
          />
          {characterName.length > 0 && !isNameValid && (
            <p className={styles.nameError} role="alert">
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
