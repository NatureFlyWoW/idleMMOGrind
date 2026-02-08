export interface IGameSystem {
  update(state: unknown, deltaMs: number): void;
}
