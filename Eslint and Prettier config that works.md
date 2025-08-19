# ESLint & Prettier Configuration Guide

This document explains the complete ESLint and Prettier setup for this multi-project workspace containing both a React Native app (`/app`) and a Next.js web application (`/web`).

## 🏗️ Project Structure

```
the-sound-approach-app and web/
├── .vscode/
│   └── settings.json                    # VS Code editor settings
├── .prettierrc.json                     # Root Prettier configuration
├── the-sound-approach-app and web.code-workspace  # Workspace configuration
├── app/
│   ├── eslint.config.mjs               # App ESLint configuration (flat config)
│   ├── prettier.config.js              # App Prettier configuration
│   ├── package.json                    # App dependencies
│   └── node_modules/                   # App-specific packages
└── web/
    ├── eslint.config.mjs               # Web ESLint configuration (flat config)
    ├── prettier.config.js              # Web Prettier configuration
    ├── package.json                    # Web dependencies
    └── node_modules/                   # Web-specific packages
```

## 🎯 Configuration Philosophy

### **Hybrid Approach: Prettier for Formatting, ESLint for Linting**

After testing multiple approaches, we settled on the industry-standard hybrid approach:

- **Prettier Extension**: Handles all code formatting (JavaScript, TypeScript, JSX, TSX, JSON)
- **ESLint Extension**: Handles code quality, linting, and shows Prettier formatting issues as warnings
- **Integration**: ESLint includes `eslint-plugin-prettier` to show formatting violations as linting warnings

This approach provides:

- ✅ Reliable formatting for all file types (no "cannot format TypeScript JSX" errors)
- ✅ Consistent formatting rules across both projects
- ✅ ESLint warnings for formatting issues
- ✅ Auto-fix capabilities through both extensions

## 📁 Configuration Files

### **1. Root Level Configuration**

#### `.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "endOfLine": "lf"
}
```

**Purpose**: Fallback configuration for the Prettier extension when it can't find project-specific configs.



#### `.vscode/settings.json`

```json
{
  // ESLint Configuration
  "eslint.enable": true,
  "eslint.workingDirectories": [
    {
      "directory": "./app",
      "changeProcessCWD": true
    },
    {
      "directory": "./web",
      "changeProcessCWD": true
    }
  ],
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "eslint.useFlatConfig": true,

  // Editor Actions on Save
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },

  // Prettier Configuration
  "prettier.requireConfig": false,
  "prettier.useEditorConfig": false,
  "prettier.enable": true,

  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "eslint.format.enable": false
}

```

**Purpose**: File-type specific formatter assignments, ensuring Prettier handles all code formatting.

- `eslint.workingDirectories` with `changeProcessCWD: true`: Ensures each project uses its own ESLint installation and configuration
- `eslint.useFlatConfig: true`: Uses modern flat config format (`eslint.config.mjs`)
- `eslint.format.enable: false`: Disables ESLint formatting to prevent conflicts with Prettier
- `prettier.requireConfig: false`: Allows Prettier to work without strict config requirements

### **2. Project-Specific Configuration**

#### `app/prettier.config.js` & `web/prettier.config.js`

```javascript
/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  printWidth: 100,
  trailingComma: "es5",
  bracketSpacing: true,
  endOfLine: "lf",
};

module.exports = config;
```

**Purpose**: Project-specific Prettier configuration. Uses JavaScript format for compatibility with ESLint.

#### `app/eslint.config.mjs` & `web/eslint.config.mjs`

Both projects use modern ESLint flat configuration format with:

- TypeScript support
- React/React Native specific rules
- Prettier integration via `eslint-plugin-prettier`
- Custom ignore patterns for config files

**Key Ignore Patterns**:

```javascript
ignores: [
  "*.config.js",
  "*.config.ts",
  "prettier.config.js",
  // ... other patterns
];
```

## 📦 Package Dependencies

### **App Project (`app/package.json`)**

```json
{
  "devDependencies": {
    "prettier": "^3.6.2",
    "eslint": "^8.57.1",
    "eslint-plugin-prettier": "^5.2.1"
    // ... other ESLint plugins
  }
}
```

### **Web Project (`web/package.json`)**

```json
{
  "devDependencies": {
    "prettier": "^3.6.2",
    "eslint": "^8.57.1",
    "eslint-plugin-prettier": "^5.2.1"
    // ... other ESLint plugins
  }
}
```

**Key Points**:

- Both projects have identical Prettier versions for consistency
- `eslint-plugin-prettier` integrates Prettier rules into ESLint
- Each project maintains its own `node_modules` for isolation

## 🔧 How It Works

### **VS Code Extension Behavior**

1. **File Formatting** (`Cmd+S` or `Shift+Option+F`):

   - Prettier extension formats the file according to project-specific config
   - Works reliably with all file types including TypeScript JSX

2. **ESLint Linting**:

   - ESLint extension uses the correct project's ESLint installation
   - Shows code quality issues and Prettier formatting violations as warnings
   - Respects flat config format (`eslint.config.mjs`)

3. **Auto-fix on Save**:
   - `editor.codeActionsOnSave` runs ESLint auto-fix
   - Applies both linting fixes and Prettier formatting
   - Equivalent to running `npm run lint:fix`

### **Command Line Behavior**

#### App Project

```bash
npm run lint        # Shows ESLint warnings including Prettier issues
npm run lint:fix    # Fixes ESLint issues and applies Prettier formatting
npm run format      # Runs Prettier directly on all files
```

#### Web Project

```bash
npm run lint        # Shows ESLint warnings including Prettier issues
npm run lint:fix    # Fixes ESLint issues and applies Prettier formatting
npm run format      # Runs Prettier directly on all files
```

## 🚀 Benefits of This Setup

### **✅ No Configuration Conflicts**

- Workspace settings are the single source of truth
- No duplicate or competing configurations
- Clear separation between VS Code settings and workspace settings

### **✅ Project Isolation**

- Each project uses its own ESLint installation and configuration
- Different ESLint plugins and rules per project
- No cross-project interference

### **✅ Consistent Formatting**

- Identical Prettier rules across both projects
- Formatting issues show as ESLint warnings
- Auto-fix applies consistent formatting

### **✅ Developer Experience**

- Format on save works reliably for all file types
- No "cannot format TypeScript JSX" errors
- Unified experience across different editors
- Clear visual feedback for formatting and linting issues

## 🛠️ Troubleshooting

### **ESLint Not Finding Configuration**

- Ensure `eslint.useFlatConfig: true` in workspace settings
- Restart ESLint server: `Cmd+Shift+P` → "ESLint: Restart ESLint Server"

### **Prettier Configuration Errors**

- Check that `.prettierrc.json` exists in root directory
- Ensure `prettier.requireConfig: false` in workspace settings
- Restart VS Code if Prettier enable/disable settings changed

### **Wrong ESLint Installation Used**

- Verify `eslint.workingDirectories` has `changeProcessCWD: true`
- Check ESLint output panel for which installation is being used
- Should show separate paths for app and web projects

## 📋 Commands Reference

### **VS Code Commands**

- `Cmd+Shift+P` → "Format Document": Formats current file with Prettier
- `Cmd+Shift+P` → "ESLint: Fix all auto-fixable problems": Runs ESLint auto-fix
- `Cmd+Shift+P` → "ESLint: Restart ESLint Server": Restarts ESLint extension

### **Terminal Commands (per project)**

```bash
# Linting
npm run lint                    # Check for issues
npm run lint:fix               # Fix auto-fixable issues

# Formatting
npm run format                 # Format all files with Prettier

# Dependencies
npm install                    # Install/update packages
```

---

This configuration provides a robust, scalable setup for maintaining code quality and consistent formatting across both React Native and Next.js projects in a single workspace.
