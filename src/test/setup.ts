import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup mounted React trees after each test
afterEach(() => {
  cleanup();
});
