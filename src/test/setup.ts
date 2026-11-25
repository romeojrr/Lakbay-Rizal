import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { useUi } from '../store/ui';

// The first test in a file also loads the lazy page and the content, which can take a
// little over the default 1 s when every file runs at once.
configure({ asyncUtilTimeout: 3000 });

// The tour starts on a fresh profile; most tests start from one, so it is marked as already
// offered. Tests of the tour set `tourOffered: false`.
beforeEach(() => {
  useUi.setState({
    tour: { active: false, step: 0 },
    tourOffered: true,
    tip: null,
    celebrations: [],
  });
});

afterEach(() => {
  cleanup();
});
