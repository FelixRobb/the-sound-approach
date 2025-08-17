import { StyleSheet, View } from "react-native";

import { useEnhancedTheme } from "../context/EnhancedThemeProvider";

const BackgroundPattern = () => {
  const { theme } = useEnhancedTheme();

  const styles = StyleSheet.create({
    backgroundPattern: {
      backgroundColor: theme.colors.background,
    },
  });
  return <View style={styles.backgroundPattern} />;
};

export default BackgroundPattern;
