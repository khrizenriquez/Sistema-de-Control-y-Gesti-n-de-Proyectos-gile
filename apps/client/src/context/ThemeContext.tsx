import { createContext, FunctionComponent, JSX } from 'preact';
import { useState, useContext, useEffect } from 'preact/hooks';

interface ThemeContextType {
  isDarkTheme: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDarkTheme: false,
  theme: 'light',
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: JSX.Element | JSX.Element[];
}

export const ThemeProvider: FunctionComponent<ThemeProviderProps> = ({ children }) => {
  // Verifica si hay una preferencia guardada en localStorage
  const storedTheme = typeof window !== 'undefined' 
    ? localStorage.getItem('theme') 
    : null;
  
  // También verifica la preferencia del sistema
  const prefersDark = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches 
    : false;
  
  // Inicializa con la preferencia guardada o la del sistema
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(
    storedTheme === 'dark' || (!storedTheme && prefersDark)
  );

  // Derive theme from isDarkTheme
  const theme = isDarkTheme ? 'dark' : 'light';

  // Efecto para aplicar las clases al html cuando cambia el tema
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (isDarkTheme) {
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      htmlElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);

  // Función para alternar entre temas
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <ThemeContext.Provider value={{ isDarkTheme, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado para usar el tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
}; 