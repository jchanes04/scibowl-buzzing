import { writable, get } from "svelte/store";

export interface ColorScheme {
    name: string;
    primary: string;
    }

// Only store the brand colors here. Backgrounds/text are handled by the dark mode logic.
export const colorSchemes: Record<string, ColorScheme> = {
    default: {
        name: "Green",
        primary: "#285",
    },
    ocean: {
        name: "Blue",
        primary: "#159",
    },
    sunset: {
        name: "Orange",
        primary: "#d80",
    },
    purple: {
        name: "Purple",
        primary: "#83b",
    },
    rose: {
        name: "Pink",
        primary: "#b27",
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

        // Set color-scheme - theme colors are now handled by light-dark() in SCSS
        root.style.setProperty('color-scheme', darkMode ? 'dark' : 'light');

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
