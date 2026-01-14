<script lang="ts">
  import { setupConvex } from 'convex-svelte';
  import { PUBLIC_CONVEX_URL } from '$env/static/public';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  // Initialize Convex at the root level
  setupConvex(PUBLIC_CONVEX_URL);
</script>

{@render children?.()}
