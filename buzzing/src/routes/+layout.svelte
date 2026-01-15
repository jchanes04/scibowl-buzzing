<script lang="ts">
  import { setupConvex } from 'convex-svelte';
  import { PUBLIC_CONVEX_URL } from '$env/static/public';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import AccountLinkingModal from '$lib/components/AccountLinkingModal.svelte';
  import { showAccountLinkingModal } from '$lib/stores/accountLinkingModal.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  // Initialize Convex at the root level
  setupConvex(PUBLIC_CONVEX_URL);

  // Check for pending account link on mount
  onMount(() => {
    if (!browser) return;

    const pendingLinkCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('pendingAccountLink='))
      ?.split('=')[1];

    if (pendingLinkCookie) {
      try {
        const { oldMemberId, newMemberId } = JSON.parse(decodeURIComponent(pendingLinkCookie));
        if (oldMemberId && newMemberId) {
          // Clear the cookie immediately
          document.cookie = 'pendingAccountLink=; Max-Age=0; path=/';
          // Show the modal
          showAccountLinkingModal(oldMemberId, newMemberId);
        }
      } catch (e) {
        console.error('Failed to parse pending account link cookie:', e);
        document.cookie = 'pendingAccountLink=; Max-Age=0; path=/';
      }
    }
  });
</script>

<AccountLinkingModal />
{@render children?.()}
