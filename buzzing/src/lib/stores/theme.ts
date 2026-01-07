import { writable, get } from "svelte/store";

export interface ColorScheme {
    name: string;
    primary: string;
    primaryDark: string;
    }

// Only store the brand colors here. Backgrounds/text are handled by the dark mode logic.
export const colorSchemes: Record<string, ColorScheme> = {
    default: {
        name: "Green",
        primary: "#285",
        primaryDark: "#173",
    },
    ocean: {
        name: "Blue",
        primary: "#159",
        primaryDark: "#124",
    },
    sunset: {
        name: "Orange",
        primary: "#d80",
        primaryDark: "#840",
    },
    purple: {
        name: "Purple",
        primary: "#83b",
        primaryDark: "#416",
    },
    rose: {
        name: "Pink",
        primary: "#b27",
        primaryDark: "#612",
    }
};

interface ThemeState {
    themeName: string;
    darkMode: boolean;
    customColor: string;
}

function hexToRgb(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // If shorthand hex (#abc), expand it
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    
    // Parse r, g, b
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
}

function createThemeStore() {
    // Initial state from localStorage or defaults
    let initialTheme = 'default';
    let initialDarkMode = false;
    let initialCustomColor = '#285'; // Default to green if not set
    
    if (typeof window !== 'undefined') {
        initialTheme = localStorage.getItem('colorScheme') || 'default';
        initialCustomColor = localStorage.getItem('customColor') || '#285';
        // Check if user has explicit preference or use system preference
        const storedDarkMode = localStorage.getItem('darkMode');
        if (storedDarkMode !== null) {
            initialDarkMode = storedDarkMode === 'true';
        } else {
            // Fallback to system preference
            initialDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    }

    const themeStore = writable<ThemeState>({
        themeName: initialTheme,
        darkMode: initialDarkMode,
        customColor: initialCustomColor
    });

    // Apply theme to CSS variables
    function applyTheme(state: ThemeState) {
        const { themeName, darkMode, customColor } = state;
        
        let primaryColor: string;
        if (themeName === 'custom') {
            primaryColor = customColor;
        } else {
            const scheme = colorSchemes[themeName] || colorSchemes['default'];
            primaryColor = scheme!.primary;
        }

        const root = document.documentElement;
        
        // Apply Brand Colors
        root.style.setProperty('--primary', primaryColor);
        root.style.setProperty('--primary-rgb', hexToRgb(primaryColor));
        
        // Apply Mode Colors (Light/Dark)
        if (darkMode) {
            root.style.setProperty('color-scheme', 'dark');
            
            // Dark Mode Palette
            root.style.setProperty('--background-1', '#000000'); // Pure black
            root.style.setProperty('--background-2', '#000000'); // Pure black
            root.style.setProperty('--background', '#000000');
            
            root.style.setProperty('--text', '#f1f5f9'); // Light gray text
            root.style.setProperty('--text-light', '#ffffff');
            root.style.setProperty('--text-muted', '#94a3b8'); // Muted text for dark mode
            
            root.style.setProperty('--border-color', '#333333'); // Dark border
            
            // Grays (inverted-ish for dark mode)
            root.style.setProperty('--gray-1', '#1e293b'); // Dark gray for backgrounds
            root.style.setProperty('--gray-2', '#94a3b8'); // Light gray for text
            // Remove old grays
            root.style.removeProperty('--gray-50');
            root.style.removeProperty('--gray-100');
            root.style.removeProperty('--gray-200');
            root.style.removeProperty('--gray-300');
            root.style.removeProperty('--gray-400');
            root.style.removeProperty('--gray-500');

        } else {
            root.style.setProperty('color-scheme', 'light');

            // Light Mode Palette
            root.style.setProperty('--background-1', 'hsl(0,0%,93%)');
            root.style.setProperty('--background-2', '#d4d9d9');
            root.style.setProperty('--background', '#d4d9d9');
            
            root.style.setProperty('--text', '#1e293b');
            root.style.setProperty('--text-light', '#ffffff');
            root.style.setProperty('--text-muted', '#64748b');
            
            root.style.setProperty('--border-color', '#666');
            
            // Standard Grays
            root.style.setProperty('--gray-1', '#e2e8f0'); // Light gray for backgrounds
            root.style.setProperty('--gray-2', '#64748b'); // Dark gray for text
            // Remove old grays
            root.style.removeProperty('--gray-50');
            root.style.removeProperty('--gray-100');
            root.style.removeProperty('--gray-200');
            root.style.removeProperty('--gray-300');
            root.style.removeProperty('--gray-400');
            root.style.removeProperty('--gray-500');
        }
        
        if (typeof window !== 'undefined') {
            localStorage.setItem('colorScheme', themeName);
            localStorage.setItem('darkMode', String(darkMode));
            localStorage.setItem('customColor', customColor);
            
            if (darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }

    // Initialize theme on creation
    if (typeof window !== 'undefined') {
        applyTheme({ 
            themeName: initialTheme, 
            darkMode: initialDarkMode,
            customColor: initialCustomColor
        });
    }

    return {
        subscribe: themeStore.subscribe,
        setTheme: (themeName: string) => {
            themeStore.update(state => {
                const newState = { ...state, themeName };
                applyTheme(newState);
                return newState;
            });
        },
        setCustomColor: (color: string) => {
            themeStore.update(state => {
                const newState = { ...state, customColor: color, themeName: 'custom' };
                applyTheme(newState);
                return newState;
            });
        },
        toggleDarkMode: () => {
            themeStore.update(state => {
                const newState = { ...state, darkMode: !state.darkMode };
                applyTheme(newState);
                return newState;
            });
        },
        setDarkMode: (value: boolean) => {
            themeStore.update(state => {
                const newState = { ...state, darkMode: value };
                applyTheme(newState);
                return newState;
            });
        },
        applyTheme: () => {
            // Helper to re-apply current state if needed (e.g. on mount)
            const state = get(themeStore);
            applyTheme(state);
        }
    };
}

export const themeStore = createThemeStore();
