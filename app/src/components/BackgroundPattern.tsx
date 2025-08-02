import { StyleSheet, View } from "react-native";

import { useThemedStyles } from "../hooks/useThemedStyles";

const BackgroundPattern = () => {
  const { theme } = useThemedStyles();

  const styles = StyleSheet.create({
    backgroundPattern: {
      backgroundColor: theme.colors.background,
    },
  });
  return <View style={styles.backgroundPattern} />;
};

export default BackgroundPattern;
