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
    <div
      className={`${styles.barContainer} ${styles[variant]} ${className}`}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label ?? `${Math.floor(current)} / ${Math.floor(max)}`}
    >
      <div className={styles.barFill} style={{ width: `${percent}%` }} />
      {showText && (
        <span className={styles.barText}>
          {label ?? `${Math.floor(current)} / ${Math.floor(max)}`}
        </span>
      )}
    </div>
  );
};
