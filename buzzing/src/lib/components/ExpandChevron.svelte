<script lang="ts">
    interface Props {
        expanded: boolean;
        size?: string;
    }

    let { expanded, size = "1.25rem" }: Props = $props();
</script>

<div
    class="expand-chevron"
    class:expanded
    style:width={size}
    style:height={size}
>
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <line x1="3" y1="12" x2="12" y2="12" class="left-line" />
        <line x1="12" y1="12" x2="21" y2="12" class="right-line" />
    </svg>
</div>

<style lang="scss">
    @use "$styles/_global.scss" as *;

    .expand-chevron {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        flex-grow: 0;
        color: $text-muted;
        transition: color 0.3s ease;

        svg {
            width: 100%;
            height: 100%;
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateY(12.5%); // Center the 'closed' V visually

            line {
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                transform-origin: 12px 12px;
            }

            .left-line {
                transform: rotate(40deg);
            }

            .right-line {
                transform: rotate(-40deg);
            }
        }

        &.expanded {
            color: $primary;

            svg {
                transform: translateY(-12.5%); // Center the 'open' V visually

                .left-line {
                    transform: rotate(-40deg);
                }

                .right-line {
                    transform: rotate(40deg);
                }
            }
        }
    }
</style>
