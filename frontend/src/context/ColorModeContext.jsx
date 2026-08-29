import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ColorModeContext = createContext(null);

export const ColorModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('colorMode') || 'light');

  useEffect(() => {
    localStorage.setItem('colorMode', mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggle: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [mode]
  );

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
};

export const useColorMode = () => useContext(ColorModeContext);
