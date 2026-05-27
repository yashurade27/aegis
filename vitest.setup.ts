import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initSync } from '@/engine/pkg/engine';

const wasmPath = join(__dirname, 'engine/pkg/engine_bg.wasm');
initSync({ module: readFileSync(wasmPath) });
