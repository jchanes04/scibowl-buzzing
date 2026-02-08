<script lang="ts">
    import { stopPropagation } from "svelte/legacy";

    import themeStore, { colorSchemes } from "$lib/stores/theme.svelte";
    import ExpandChevron from "./ExpandChevron.svelte";

    let menuOpen = $state(false);
    let clickLock = false;
    let menuElement = $state<HTMLElement>();
    let buttonElement = $state<HTMLElement>();
    let colorPickerInput = $state<HTMLInputElement>();

    function toggleMenu() {
        menuOpen = !menuOpen;
    }

    function selectTheme(themeName: string) {
        themeStore.setTheme(themeName);
        // Don't close menu immediately so user can toggle dark mode too if they want
        // menuOpen = false;
    }

    function toggleDarkMode() {
        themeStore.toggleDarkMode();
    }

    function cycleTheme() {
        if (currentThemeName === "custom") {
            menuOpen = true;
            setTimeout(() => {
                colorPickerInput?.click();
            }, 0);
            setTimeout(() => {
                menuOpen = false;
            }, 100);

            return;
        }
        const keys = Object.keys(colorSchemes);
        const currentIndex = keys.indexOf(currentThemeName);
        const nextIndex = (currentIndex + 1) % keys.length;
        const nextKey = keys[nextIndex];
        if (nextKey) {
            themeStore.setTheme(nextKey);
        }
    }

    function handleWindowClick(e: MouseEvent) {
        if (
            menuElement &&
            buttonElement &&
            !menuElement.contains(e.target as Node) &&
            !buttonElement.contains(e.target as Node) &&
            !clickLock
        ) {
            menuOpen = false;
        }
    }

    function handleMouseDown(e: MouseEvent) {
        if (menuElement && menuElement.contains(e.target as Node)) {
            clickLock = true;
        }
        if (buttonElement && buttonElement.contains(e.target as Node)) {
            clickLock = true;
        }
    }

    function handleMouseUp() {
        clickLock = false;
    }

    let currentThemeName = $derived(themeStore.themeName);
    let isDarkMode = $derived(themeStore.darkMode);
    let customColor = $derived(themeStore.customColor);

    function handleCustomColorChange(e: Event) {
        const target = e.target as HTMLInputElement;
        let value = target.value;

        // Always ensure it starts with #
        if (!value.startsWith("#")) {
            value = "#" + value;
        }

        // Only allow valid hex characters after #
        const hexPart = value.slice(1).replace(/[^0-9a-fA-F]/g, "");
        const newValue = "#" + hexPart.slice(0, 6);

        themeStore.setCustomColor(newValue);

        // Update target value to keep it in sync and prevent cursor jumping
        if (target.value !== newValue) {
            target.value = newValue;
        }
    }
</script>

<svelte:window
    onclick={handleWindowClick}
    onmousedown={handleMouseDown}
    onmouseup={handleMouseUp}
/>

<div class="theme-selector">
    <button
        class="theme-button"
        onclick={toggleMenu}
        bind:this={buttonElement}
        aria-label="Select color theme"
    >
        <svg class="icon" viewBox="0 0 24 24" fill="none">
            <g transform="rotate(25 12 12)">
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <path
                    onclick={stopPropagation(cycleTheme)}
                    d="M12 3 A9 9 0 0 0 12 21 Z"
                    fill={currentThemeName === "custom"
                        ? customColor
                        : colorSchemes[currentThemeName]?.primary ||
                          colorSchemes["default"]?.primary}
                />
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <path
                    onclick={stopPropagation(toggleDarkMode)}
                    d="M12 3 A9 9 0 0 1 12 21 Z"
                    fill={isDarkMode ? "#000000" : "#ffffff"}
                />
            </g>
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke={isDarkMode ? "#ffffff" : "#000000"}
                stroke-width="2"
                fill="none"
            />
        </svg>
        <ExpandChevron expanded={menuOpen} size="1em" />
    </button>

    {#if menuOpen}
        <div class="menu" bind:this={menuElement}>
            <div class="menu-section">
                <div class="menu-header">Mode</div>
                <button class="menu-item toggle-item" onclick={toggleDarkMode}>
                    <div class="toggle-label">
                        {#if isDarkMode}
                            <svg
                                class="mode-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path
                                    d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                                ></path>
                            </svg>
                            Dark Mode
                        {:else}
                            <svg
                                class="mode-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"
                                ></line>
                                <line
                                    x1="18.36"
                                    y1="18.36"
                                    x2="19.78"
                                    y2="19.78"
                                ></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"
                                ></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"
                                ></line>
                            </svg>
                            Light Mode
                        {/if}
                    </div>
                    <div class="toggle-switch" class:checked={isDarkMode}>
                        <div class="toggle-thumb"></div>
                    </div>
                </button>
            </div>

            <div class="divider"></div>

            <div class="menu-section">
                <div class="menu-header">Color Scheme</div>
                {#each Object.entries(colorSchemes) as [key, scheme]}
                    <button
                        class="theme-option"
                        class:active={currentThemeName === key}
                        onclick={() => selectTheme(key)}
                    >
                        <div
                            class="color-preview"
                            style="background-color: {scheme.primary}"
                        ></div>
                        <span class="theme-name">{scheme.name}</span>
                        {#if currentThemeName === key}
                            <svg
                                class="check-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        {/if}
                    </button>
                {/each}

                <div class="custom-theme-container">
                    <button
                        class="theme-option"
                        class:active={currentThemeName === "custom"}
                        onclick={() => selectTheme("custom")}
                    >
                        <div
                            class="color-preview custom"
                            style="background-color: {customColor}"
                        ></div>
                        <span class="theme-name">Custom</span>
                        {#if currentThemeName === "custom"}
                            <svg
                                class="check-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        {/if}
                    </button>

                    <div class="color-picker-wrapper">
                        <input
                            type="color"
                            class="color-picker"
                            bind:this={colorPickerInput}
                            value={customColor}
                            oninput={handleCustomColorChange}
                        />
                        <input
                            type="text"
                            class="color-hex"
                            value={customColor}
                            oninput={handleCustomColorChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .theme-selector {
        position: relative;
    }

    .theme-button {
        display: flex;
        align-items: center;
        gap: 0.4em;
        padding: 0.25em 0.25em;
        background: transparent;
        border: 1px solid $border-color;
        border-radius: 0.5em;
        cursor: pointer;
        transition: all 0.2s;
        color: $text;
        font-size: inherit;

        &:hover {
            background-color: $background-2;
            border-color: $primary;
        }

        .icon {
            width: 1.2em;
            height: 1.2em;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .menu {
        position: absolute;
        right: 0;
        top: calc(100% + 0.5em);
        background: $background-1;
        border: 1px solid $border-color;
        border-radius: 0.5em;
        box-shadow:
            $shadow,
            0 10px 15px -3px rgb(0 0 0 / 0.1);
        min-width: 220px;
        z-index: 1000;
        overflow: hidden;
    }

    .menu-header {
        padding: 0.5em 1em;
        font-weight: 600;
        font-size: 0.75rem;
        color: $text-muted;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .divider {
        height: 1px;
        background-color: $border-color;
        margin: 0;
    }

    .menu-item {
        display: block;
        width: 100%;
        border: none;
        background: transparent;
        text-align: left;
        padding: 0.75em 1em;
        cursor: pointer;
        transition: background-color 0.15s;
        color: $text;

        &:hover {
            background-color: $background-2;
        }
    }

    .toggle-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .toggle-label {
        display: flex;
        align-items: center;
        gap: 0.5em;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .mode-icon {
        width: 1.1em;
        height: 1.1em;
        color: $text-muted;
    }

    .toggle-switch {
        width: 2.2em;
        height: 1.2em;
        background-color: $gray-2;
        border-radius: 1em;
        position: relative;
        transition: background-color 0.2s;

        &.checked {
            background-color: $primary;

            .toggle-thumb {
                transform: translateX(1em);
                background-color: white;
            }
        }

        .toggle-thumb {
            width: 1em;
            height: 1em;
            background-color: white;
            border-radius: 50%;
            position: absolute;
            top: 0.1em;
            left: 0.1em;
            transition: transform 0.2s;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
    }

    .theme-option {
        display: flex;
        align-items: center;
        gap: 0.75em;
        width: 100%;
        padding: 0.75em 1em;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: background-color 0.15s;
        text-align: left;
        color: $text;

        &:hover {
            background-color: $background-2;
            border-color: $primary;
        }

        &.active {
            background-color: $background-2;
            font-weight: 600;
        }

        .color-preview {
            width: 1.2em;
            height: 1.2em;
            border-radius: 50%;
            border: 2px solid $border-color;
            flex-shrink: 0;
        }

        .theme-name {
            flex: 1;
            font-size: 0.9rem;
        }

        .check-icon {
            width: 1em;
            height: 1em;
            color: $primary;
            flex-shrink: 0;
        }
    }

    .custom-theme-container {
        display: flex;
        flex-direction: column;
    }

    .color-picker-wrapper {
        display: flex;
        align-items: center;
        gap: 0.75em;
        padding: 0.25em 0.25em 0.25em calc(3ch + 0.25em);
        animation: slideDown 0.2s ease-out;
    }

    .color-picker {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        width: 4ch;
        height: 1.5em;
        background-color: transparent;
        border: none;
        cursor: pointer;
        padding: 0;

        &::-webkit-color-swatch {
            border-radius: 4px;
            border: 1px solid $border-color;
        }
        &::-moz-color-swatch {
            border-radius: 4px;
            border: 1px solid $border-color;
        }
    }

    .color-hex {
        font-size: 0.8rem;
        font-family: monospace;
        color: $text-muted;
        text-transform: uppercase;
        background: transparent;
        border: 1px solid transparent;
        padding: 0.2em 0.4em;
        border-radius: 4px;
        width: 7ch;
        transition: all 0.2s;

        &:hover,
        &:focus {
            border-color: $border-color;
            background: $background-2;
            color: $text;
            outline: none;
        }
    }
</style>
