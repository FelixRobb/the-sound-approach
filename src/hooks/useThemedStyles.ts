import { useContext } from 'react';
import { useTheme } from 'react-native-paper';
import { ThemeContext } from '../context/ThemeContext';
import { MD3Theme } from 'react-native-paper';

/**
 * A hook that provides access to the current theme and isDarkMode flag
 * 
 * @returns {Object} Object containing theme and isDarkMode
 */
export const useThemedStyles = () => {
  const theme = useTheme() as MD3Theme;
  const { isDarkMode } = useContext(ThemeContext);
  
  return {
    theme,
    isDarkMode,
  };
}; 