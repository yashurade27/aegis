'use client';
import React, { useEffect, useState } from 'react';
import init from '@/engine/pkg/engine';

export function WasmProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    init().then(() => setLoaded(true)).catch(console.error);
  }, []);

  if (!loaded) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading Engine...</div>;

  return <>{children}</>;
}
