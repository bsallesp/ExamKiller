"use client";

import { useEffect } from 'react';
import { migrateLegacyStateOnce } from '@/lib/client/migrate';

export function MigrateEffect() {
  useEffect(() => {
    migrateLegacyStateOnce().catch(() => {});
  }, []);
  return null;
}
