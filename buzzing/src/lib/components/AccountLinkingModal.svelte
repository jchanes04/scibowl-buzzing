<script lang="ts">
  import { accountLinkingModal, hideAccountLinkingModal } from '$lib/stores/accountLinkingModal.svelte';
  import { useConvexClient } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';

  const convex = useConvexClient();

  let loading = $state(false);
  let error = $state<string | null>(null);

  async function handleLink() {
    if (!accountLinkingModal.oldMemberId || !accountLinkingModal.newMemberId) return;

    loading = true;
    error = null;

    try {
      await convex.mutation(api.gameHistory.migrateMemberId, {
        oldMemberId: accountLinkingModal.oldMemberId,
        newMemberId: accountLinkingModal.newMemberId
      });

      // Clear the persistentMemberId cookie since we've migrated
      document.cookie = 'persistentMemberId=; Max-Age=0; path=/';

      hideAccountLinkingModal();
    } catch (e) {
      console.error('Failed to link accounts:', e);
      error = 'Failed to link accounts. Please try again.';
    } finally {
      loading = false;
    }
  }

  function handleSkip() {
    // Clear the persistentMemberId cookie without migrating
    document.cookie = 'persistentMemberId=; Max-Age=0; path=/';
    hideAccountLinkingModal();
  }
</script>

{#if accountLinkingModal.visible}
  <div class="modal-backdrop" onclick={handleSkip} onkeydown={(e) => e.key === 'Escape' && handleSkip()} role="button" tabindex="-1"></div>
  <div class="account-linking-modal">
    <h2>Link Previous Games?</h2>
    <p>
      We found games you played before logging in. Would you like to link those games to your account so they appear in your game history?
    </p>
    {#if error}
      <p class="error">{error}</p>
    {/if}
    <div class="buttons">
      <button onclick={handleSkip} disabled={loading}>No, Start Fresh</button>
      <button onclick={handleLink} disabled={loading} class="primary">
        {#if loading}
          Linking...
        {:else}
          Yes, Link Games
        {/if}
      </button>
    </div>
  </div>
{/if}

<style lang="scss">
  @use '$styles/_global.scss' as *;

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }

  .account-linking-modal {
    background: $background-1;
    border-radius: 1.5rem;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 2.5rem;
    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    border: 1px solid $border-color;
    width: 90%;
    max-width: 450px;
    z-index: 100;
    text-align: center;
  }

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 800;
    color: $text;
  }

  p {
    margin: 0 0 2rem 0;
    font-size: 1.1rem;
    color: $gray-2;
    line-height: 1.5;
  }

  .error {
    color: $red;
    margin: -1rem 0 1.5rem 0;
    font-size: 0.9rem;
  }

  .buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  button {
    @extend %button;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;

    &:first-of-type {
      background: $gray-1;
      color: $gray-2;
      box-shadow: none;

      &:hover {
        filter: brightness(0.95);
      }
    }

    &.primary {
      min-width: 140px;
    }
  }
</style>
