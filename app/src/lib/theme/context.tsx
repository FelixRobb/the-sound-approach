import { createContext } from "react";

import { ThemeContextType } from "./types";

// Create the theme context
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Export the context for use in hooks
export { ThemeContext as default };
