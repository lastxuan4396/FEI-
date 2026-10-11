import { validateConfig } from './config.js';
import { validateState } from './engine.js';
export const SAVE_KEY = 'flight-chess.save.v1';
export const BACKUP_KEY = 'flight-chess.backup.v1';
export const FORMAT = 'flight-chess-save';

export function makeSave(config, state) {
  return { format: FORMAT, version: 1, savedAt: new Date().toISOString(), config, state };
}
export function parseSave(source) {
  if (typeof source !== 'string' || source.length > 2_000_000) throw new Error('存档过大或格式不正确');
  let payload;
  try { payload = JSON.parse(source); } catch { throw new Error('存档 JSON 不正确'); }
  if (!payload || payload.format !== FORMAT || payload.version !== 1 || typeof payload.savedAt !== 'string' || !Number.isFinite(Date.parse(payload.savedAt))) throw new Error('不支持这个存档格式');
  const config = validateConfig(payload.config);
  const state = validateState(payload.state, config);
  return { ...payload, config, state };
}

/** Storage is injected so quota errors and damaged saves can be tested. */
export function createRepository(storage) {
  return {
    load() {
      const errors = [];
      for (const key of [SAVE_KEY, BACKUP_KEY]) {
        try {
          const source = storage.getItem(key);
          if (!source) continue;
          const payload = parseSave(source);
          return { payload, recovered: key === BACKUP_KEY, error: null };
        } catch (error) { errors.push(error.message); }
      }
      return { payload: null, recovered: false, error: errors.length ? '存档不可用：' + errors.join('；') : null };
    },
    save(config, state) {
      const payload = makeSave(validateConfig(config), validateState(state, config));
      const source = JSON.stringify(payload);
      if (source.length > 2_000_000) throw new Error('存档超过大小限制，请导出后精简任务库');
      const previous = storage.getItem(SAVE_KEY);
      if (previous) {
        try { parseSave(previous); storage.setItem(BACKUP_KEY, previous); } catch { /* Keep any existing usable backup. */ }
      }
      storage.setItem(SAVE_KEY, source);
      return payload;
    }
  };
}
