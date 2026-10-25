import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { store } from '../data/storage';
import type { Inspection } from '../data/types';

/**
 * Shared across screens so a screen that gains focus reads only after the
 * previous screen's edits are written, and edits land in order.
 */
let saveQueue: Promise<void> = Promise.resolve();

export function flushSaves(): Promise<void> {
  return saveQueue;
}

/** Loads an inspection whenever the screen gains focus and saves every update. */
export function useInspection(id: string | undefined) {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const current = useRef<Inspection | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!id) return;
      saveQueue
        .then(() => store.getInspection(id))
        .then((loaded) => {
          if (!active) return;
          current.current = loaded;
          setInspection(loaded);
          setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [id]),
  );

  const update = useCallback((change: (draft: Inspection) => Inspection) => {
    const prev = current.current;
    if (!prev) return;
    const next = { ...change(prev), updatedAt: new Date().toISOString() };
    current.current = next;
    setInspection(next);
    saveQueue = saveQueue.then(() => store.saveInspection(next)).catch((e) => console.error(e));
  }, []);

  return { inspection, loading, update };
}
