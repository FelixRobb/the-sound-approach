import { useContext } from 'react';
import { useTheme } from 'react-native-paper';
import { ThemeContext } from '../context/ThemeContext';
import { MD3Theme } from 'react-native-paper';
import { Colors } from '../theme';

/**
 * A hook that provides access to the current theme, isDarkMode flag, and theme colors
 * 
 * @returns {Object} Object containing theme, isDarkMode, and colors
 */
export const useThemedStyles = () => {
  const theme = useTheme() as MD3Theme;
  const { isDarkMode } = useContext(ThemeContext);
  
  // Get the appropriate color set based on the current theme
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  return {
    theme,
    isDarkMode,
    colors: {
      ...colors,
      ...Colors,
    },
  };
}; 