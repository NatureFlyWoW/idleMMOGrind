import { describe, it, expect } from 'vitest';
import { loadTemplate, listTemplates } from '../../../../tools/art-engine/src/icons/templates.js';

describe('listTemplates', () => {
  it('returns available weapon templates', () => {
    const templates = listTemplates('weapon');
    expect(templates.length).toBeGreaterThan(0);
    expect(templates).toContain('longsword');
  });
});

describe('loadTemplate', () => {
  it('loads a weapon template by name', () => {
    const template = loadTemplate('weapon', 'longsword');
    expect(template.name).toBe('longsword');
    expect(template.category).toBe('weapon');
    expect(template.size.width).toBe(48);
    expect(template.size.height).toBe(48);
  });

  it('has a silhouette mask', () => {
    const template = loadTemplate('weapon', 'longsword');
    expect(template.silhouette.length).toBe(48);
    expect(template.silhouette[0]!.length).toBe(48);
  });

  it('has named regions', () => {
    const template = loadTemplate('weapon', 'longsword');
    expect(template.regions.length).toBeGreaterThan(0);
    const regionNames = template.regions.map(r => r.name);
    expect(regionNames).toContain('blade');
    expect(regionNames).toContain('hilt');
  });

  it('regions reference valid material types', () => {
    const template = loadTemplate('weapon', 'longsword');
    const validMaterials = ['iron', 'gold', 'leather', 'cloth', 'bone', 'crystal', 'wood', 'stone'];
    for (const region of template.regions) {
      expect(validMaterials).toContain(region.material);
    }
  });

  it('throws for unknown template', () => {
    expect(() => loadTemplate('weapon', 'nonexistent')).toThrow();
  });
});
