/**
 * zustand/middleware の StateStorage と同じ形。
 * kit が zustand に依存しなくて済むよう、必要な部分だけをここで定義する。
 */
export interface StateStorage {
    getItem: (name: string) => string | null | Promise<string | null>;
    setItem: (name: string, value: string) => void | Promise<void>;
    removeItem: (name: string) => void | Promise<void>;
}
//# sourceMappingURL=state-storage.d.ts.map