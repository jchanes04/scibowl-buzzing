<script lang="ts">
  import { setupConvex, useConvexClient } from "convex-svelte";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { modalStore } from "$lib/stores/modal.svelte";
  import Confirm from "$lib/components/Confirm.svelte";
  import Toast from "$lib/components/Toast.svelte";
  import { api } from "../../convex/_generated/api";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  // Initialize Convex at the root level
  setupConvex(PUBLIC_CONVEX_URL);
  const convex = useConvexClient();

  let loading = $state(false);
  let error = $state<string | null>(null);
  let linkData = $state<{ oldMemberId: string; newMemberId: string } | null>(
    null,
  );

  async function handleLink() {
    if (!linkData) return;

    loading = true;
    error = null;

    try {
      await convex.mutation(api.gameHistory.migrateMemberId, {
        oldMemberId: linkData.oldMemberId,
        newMemberId: linkData.newMemberId,
      });

      // Clear the persistentMemberId cookie since we've migrated
      document.cookie = "persistentMemberId=; Max-Age=0; path=/";

      modalStore.hide();
      linkData = null;
    } catch (e) {
      console.error("Failed to link accounts:", e);
      error = "Failed to link accounts. Please try again.";
      // Update modal with error
      showLinkModal();
    } finally {
      loading = false;
    }
  }

  function handleSkip() {
    // Clear the persistentMemberId cookie without migrating
    document.cookie = "persistentMemberId=; Max-Age=0; path=/";
    modalStore.hide();
    linkData = null;
  }

  function showLinkModal() {
    modalStore.show({
      title: "Link Previous Games?",
      message:
        error ||
        "We found games you played before logging in. Would you like to link those games to your account so they appear in your game history?",
      confirmText: loading ? "Linking..." : "Yes, Link Games",
      cancelText: "No, Start Fresh",
      confirmCallback: handleLink,
      cancelCallback: handleSkip,
      disabled: loading,
    });
  }

  // Check for pending account link on mount
  onMount(() => {
    if (!browser) return;

    const pendingLinkCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("pendingAccountLink="))
      ?.split("=")[1];

    if (pendingLinkCookie) {
      try {
        const { oldMemberId, newMemberId } = JSON.parse(
          decodeURIComponent(pendingLinkCookie),
        );
        if (oldMemberId && newMemberId) {
          // Clear the cookie immediately
          document.cookie = "pendingAccountLink=; Max-Age=0; path=/";
          // Show the modal
          linkData = { oldMemberId, newMemberId };
          showLinkModal();
        }
      } catch (e) {
        console.error("Failed to parse pending account link cookie:", e);
        document.cookie = "pendingAccountLink=; Max-Age=0; path=/";
      }
    }
  });
</script>

{#if modalStore.current}
  {#if "component" in modalStore.current}
    {@const ModalComponent = modalStore.current.component}
    <ModalComponent {...modalStore.current.props} />
  {:else}
    <Confirm {...modalStore.current} />
  {/if}
{/if}

<Toast />

{@render children?.()}

<style lang="scss">
</style>
