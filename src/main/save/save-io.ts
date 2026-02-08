import { gzipSync, gunzipSync } from 'zlib';
import { createHash } from 'crypto';
import type { ISaveData } from '@shared/types/save';

const MAGIC_BYTES = Buffer.from('IDLE');
const SAVE_VERSION = 1;

/**
 * Compute a SHA-256 checksum of the save data (excluding the checksum field itself).
 */
export function computeChecksum(save: ISaveData): string {
  const copy = { ...save, meta: { ...save.meta, checksum: '' } };
  const json = JSON.stringify(copy);
  return createHash('sha256').update(json).digest('hex');
}

/**
 * Serialize save data to a gzipped Buffer with magic bytes header.
 * Format: [4 bytes IDLE magic] [1 byte version] [gzipped JSON]
 */
export function serializeSave(save: ISaveData): Buffer {
  // Update lastSavedAt BEFORE computing checksum so the hash covers the final data
  const saveWithTimestamp: ISaveData = {
    ...save,
    meta: { ...save.meta, lastSavedAt: new Date().toISOString() },
  };
  const checksum = computeChecksum(saveWithTimestamp);
  const saveWithChecksum: ISaveData = {
    ...saveWithTimestamp,
    meta: { ...saveWithTimestamp.meta, checksum },
  };

  const json = JSON.stringify(saveWithChecksum);
  const compressed = gzipSync(Buffer.from(json, 'utf-8'));

  const header = Buffer.alloc(5);
  MAGIC_BYTES.copy(header, 0);
  header.writeUInt8(SAVE_VERSION, 4);

  return Buffer.concat([header, compressed]);
}

/**
 * Deserialize a save buffer back to ISaveData.
 * Validates magic bytes and decompresses.
 */
export function deserializeSave(buffer: Buffer): ISaveData {
  // Validate magic bytes
  const magic = buffer.subarray(0, 4);
  if (!magic.equals(MAGIC_BYTES)) {
    throw new Error('Invalid save file: magic bytes mismatch');
  }

  const version = buffer.readUInt8(4);
  if (version > SAVE_VERSION) {
    throw new Error(`Save version ${version} is newer than supported version ${SAVE_VERSION}`);
  }

  const compressed = buffer.subarray(5);
  const json = gunzipSync(compressed).toString('utf-8');
  const save = JSON.parse(json) as ISaveData;

  // Validate checksum
  const expectedChecksum = computeChecksum(save);
  if (save.meta.checksum && save.meta.checksum !== expectedChecksum) {
    throw new Error('Save file checksum mismatch -- data may be corrupted');
  }

  return save;
}

/**
 * Validate save schema version and run migrations if needed.
 */
export function validateSaveVersion(save: ISaveData): ISaveData {
  // Future: apply migrations here
  return save;
}
