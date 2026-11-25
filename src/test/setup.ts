import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// The first test in a file also loads the lazy page and the content, which can take a
// little over the default 1 s when every file runs at once.
configure({ asyncUtilTimeout: 3000 });

afterEach(() => {
  cleanup();
});
