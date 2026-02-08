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
