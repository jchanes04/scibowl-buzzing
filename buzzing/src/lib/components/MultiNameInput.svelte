<script lang="ts">
    interface Props {
        items?: string[];
        newItemName?: string;
        placeholder?: string;
        maxItems?: number;
    }

    let {
        items = $bindable([]),
        newItemName = $bindable(""),
        placeholder = "Add item...",
        maxItems = undefined,
    }: Props = $props();

    function addItem() {
        if (newItemName && !items.includes(newItemName.trim())) {
            items = [...items, newItemName.trim()];
            newItemName = "";
        }
    }

    function removeItem(itemToRemove: string) {
        items = items.filter((t) => t !== itemToRemove);
    }

    function handleInputKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            addItem();
        }
    }

    function handleInput() {
        if (newItemName.length > 30) {
            newItemName = newItemName.slice(0, 30);
        }
    }

    let canAddMore = $derived(
        maxItems === undefined || items.length < maxItems,
    );
</script>

<div class="multi-name-list">
    {#each items as item}
        <div class="item-card">
            <span class="item-name">{item}</span>
            <button
                type="button"
                class="icon-btn remove"
                onclick={() => removeItem(item)}
                aria-label="Remove item"
            ></button>
        </div>
    {/each}

    {#if canAddMore}
        <div class="item-card input-card">
            <input
                type="text"
                {placeholder}
                bind:value={newItemName}
                onkeydown={handleInputKeydown}
                oninput={handleInput}
            />
            <button
                type="button"
                class="icon-btn add"
                onclick={addItem}
                aria-label="Add item"
            ></button>
        </div>
    {/if}
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .multi-name-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.5rem;
        width: 100%;
        max-width: 100%;
    }

    .item-card {
        background: $background-1;
        border: 3px solid $border-color;
        border-radius: 1rem;
        padding: 0.75rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s;

        .item-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: $text;
            word-break: break-word;
        }

        &.input-card {
            &:focus-within {
                border-color: $primary;
            }
        }
    }

    input[type="text"] {
        @extend %text-input;
        margin: 0;
        border: none;
        box-shadow: none;
        background: transparent;
        padding: 0 0.25rem;
        font-size: 1.1rem;
        width: 100%;
        text-align: left;
        line-height: 1.5;

        &:focus {
            outline: none;
            border: none;
            box-shadow: none;
        }
    }

    .icon-btn {
        width: 1.5rem;
        height: 1.5rem;
        background: transparent;
        border: none;
        cursor: pointer;
        display: block;
        position: relative;
        transition:
            transform 0.1s,
            opacity 0.2s;
        flex-shrink: 0;
        margin-left: 0.75rem;
        padding: 0;
        -webkit-appearance: none;
        appearance: none;

        &::before {
            content: "";
            position: absolute;
            inset: 0;
        }

        &:hover {
            opacity: 0.8;
            transform: #{"scale(1.1)"};
        }
        &:active {
            transform: #{"scale(0.95)"};
        }

        &.add::before {
            background: $green;
            clip-path: polygon(
                0 40%,
                40% 40%,
                40% 0,
                60% 0,
                60% 40%,
                100% 40%,
                100% 60%,
                60% 60%,
                60% 100%,
                40% 100%,
                40% 60%,
                0 60%
            );
        }

        &.remove::before {
            background: $red;
            clip-path: polygon(
                20% 0%,
                0% 20%,
                30% 50%,
                0% 80%,
                20% 100%,
                50% 70%,
                80% 100%,
                100% 80%,
                70% 50%,
                100% 20%,
                80% 0%,
                50% 30%
            );
        }
    }
</style>
