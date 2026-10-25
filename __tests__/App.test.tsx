/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// The app talks to your Flask backend; in tests we fake the network.
beforeEach(() => {
  (globalThis as any).fetch = jest.fn(async (url: string) => ({
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify(
        String(url).includes('/api/users')
          ? {users: [{id: 1, name: 'Asha'}]}
          : {status: 'ok'},
      ),
  }));
});

test('shows the profile picker first and lists users', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  const json = JSON.stringify(tree!.toJSON());
  expect(json).toContain('VYNDRA');
  expect(json).toContain('Asha');
});