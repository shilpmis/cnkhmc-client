import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from './redux/store';
import { AbilityProvider } from './contexts/AbilityProvider';
import App from './App';
import { vi } from 'vitest';

vi.mock('@/services/AuthService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/AuthService')>();
  return {
    ...actual,
    useVerifyQuery: () => ({
      data: null,
      error: null,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: false,
    }),
  };
});

describe('App Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Provider store={store}>
        <AbilityProvider>
          <App />
        </AbilityProvider>
      </Provider>
    );
    expect(container).toBeDefined();
  });
});
