import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const INITIAL_ERROR_STATE = {
  error: false,
  message: '',
};

const AppErrorContext = createContext(null);

export function AppErrorProvider({ children }) {
  const [errorState, setErrorState] = useState(INITIAL_ERROR_STATE);

  const setGlobalError = useCallback((message) => {
    setErrorState({
      error: true,
      message: message || 'Something went wrong.',
    });
  }, []);

  const clearGlobalError = useCallback(() => {
    setErrorState(INITIAL_ERROR_STATE);
  }, []);

  const value = useMemo(() => ({
    errorState,
    setErrorState,
    setGlobalError,
    clearGlobalError,
  }), [errorState, setGlobalError, clearGlobalError]);

  return (
    <AppErrorContext.Provider value={value}>
      {children}
    </AppErrorContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppError() {
  const context = useContext(AppErrorContext);
  if (!context) {
    throw new Error('useAppError must be used inside AppErrorProvider');
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export { INITIAL_ERROR_STATE };
