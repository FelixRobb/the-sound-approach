# Typography System Guide

The new typography system makes it much easier to create consistent, theme-aware text styles throughout your app. Here's how to use it:

## Quick Start

```tsx
import { useThemedTextStyles, useTextStyle } from '../lib/theme';

const MyComponent = () => {
  const textStyles = useThemedTextStyles();
  
  return (
    <View>
      <Text style={textStyles.h1}>Main Heading</Text>
      <Text style={textStyles.body}>Body text</Text>
      <Text style={useTextStyle({ size: "lg", weight: "bold", color: "primary" })}>
        Custom styled text
      </Text>
    </View>
  );
};
```

## Available Methods (Choose What Works Best)

### 1. Predefined Themed Styles (Recommended for most cases)
```tsx
const textStyles = useThemedTextStyles();

// Headers
<Text style={textStyles.h1}>Heading 1</Text>
<Text style={textStyles.h2}>Heading 2</Text>
<Text style={textStyles.h3}>Heading 3</Text>

// Body text
<Text style={textStyles.body}>Regular body text</Text>
<Text style={textStyles.bodyLarge}>Large body text</Text>
<Text style={textStyles.bodySmall}>Small body text</Text>

// UI text
<Text style={textStyles.label}>Label text</Text>
<Text style={textStyles.caption}>Caption text</Text>
<Text style={textStyles.buttonPrimary}>Button text</Text>
```

### 2. Custom Text Styles with Theme Colors
```tsx
// Most flexible - specify exactly what you need
<Text style={useTextStyle({ 
  size: "xl", 
  weight: "semiBold", 
  color: "primary",
  textAlign: "center" 
})}>
  Custom text
</Text>
```

### 3. Quick Text Function (Fastest for simple cases)
```tsx
const quickText = useQuickText();

<Text style={quickText("lg", "bold")}>Quick styled text</Text>
<Text style={quickText("sm", "medium", theme.colors.error)}>Error text</Text>
```

### 4. Base Text Styles (No theme colors)
```tsx
import { textStyles } from '../lib/theme';

<Text style={[textStyles.h1, { color: theme.colors.onSurface }]}>
  Base style with manual color
</Text>
```

### 5. Direct in StyleSheet
```tsx
const styles = StyleSheet.create({
  title: createThemedTextStyle(theme, { 
    size: "2xl", 
    weight: "bold", 
    color: "onSurface" 
  }),
  subtitle: createThemedTextStyle(theme, { 
    size: "lg", 
    weight: "medium", 
    color: "onSurfaceVariant" 
  }),
});
```

## Font Size Scale

| Size | Pixels | Usage |
|------|--------|-------|
| `xs` | 11px | Small captions, badges |
| `sm` | 12px | Labels, small text |
| `base` | 14px | Body text, buttons |
| `lg` | 16px | Large body text |
| `xl` | 18px | Subheadings |
| `2xl` | 20px | Small headings |
| `3xl` | 22px | Medium headings |
| `4xl` | 24px | Large headings |
| `5xl` | 28px | Extra large headings |
| `6xl` | 32px | Display text |
| `7xl` | 36px | Large display |
| `8xl` | 45px | Extra large display |
| `9xl` | 57px | Massive display |

## Font Weights

- `thin` (100)
- `light` (200)
- `regular` (300)
- `normal` (400) - Default
- `medium` (500)
- `semiBold` (600)
- `bold` (700)
- `extraBold` (800)
- `black` (900)

## Line Heights

- `none` (1.0)
- `tight` (1.25)
- `snug` (1.375)
- `normal` (1.5) - Default
- `relaxed` (1.625)
- `loose` (2.0)

## Theme Colors

Available color keys for the `color` prop:
- `primary`, `secondary`, `tertiary`
- `onSurface`, `onSurfaceVariant`
- `error`, `success`, `warning`, `info`
- Or any custom color string: `"#FF0000"`, `"red"`, etc.

## Migration from Old System

### Before (Hard to use):
```tsx
const styles = StyleSheet.create({
  text: {
    fontSize: theme.typography.labelSmall.fontSize,
    fontWeight: theme.typography.labelSmall.fontWeight,
    color: theme.colors.onSurfaceVariant,
  },
});
```

### After (Much easier):
```tsx
// Option 1: Hook
<Text style={useTextStyle({ size: "xs", weight: "medium", color: "onSurfaceVariant" })}>

// Option 2: Predefined
const textStyles = useThemedTextStyles();
<Text style={textStyles.labelSmall}>

// Option 3: StyleSheet
const styles = StyleSheet.create({
  text: createThemedTextStyle(theme, { 
    size: "xs", 
    weight: "medium", 
    color: "onSurfaceVariant" 
  }),
});
```

## Best Practices

1. **Use `useThemedTextStyles()` for common text patterns** - it's the most convenient
2. **Use `useTextStyle()` for custom combinations** - very flexible
3. **Use `useQuickText()` for simple, one-off text styling** - fastest
4. **Use `createThemedTextStyle()` in StyleSheet.create()** for component-specific styles
5. **Prefer semantic sizes** (`xs`, `sm`, `base`) over pixel values
6. **Use theme colors** (`"primary"`, `"onSurface"`) instead of hardcoded colors
7. **Be consistent** - pick one or two methods and stick with them in your component

## Examples

See `src/examples/TypographyExamples.tsx` for comprehensive examples of all methods.
