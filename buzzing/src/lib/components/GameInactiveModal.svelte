<script lang="ts">
  interface Props {
    reopenCallback: () => void;
    leaveCallback: () => void;
  }
  let { reopenCallback, leaveCallback }: Props = $props();
</script>

<div class="inactive-modal">
  <h2>Game Inactive</h2>
  <p>This game has been paused due to inactivity. You can reopen it to continue playing, or leave to return to the home page.</p>
  <button onclick={leaveCallback}>Leave Game</button>
  <button onclick={reopenCallback}>Reopen Game</button>
</div>

<style lang="scss">
  @use '$styles/_global.scss' as *;

  .inactive-modal {
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

  button {
    @extend %button;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    margin: 0 0.5rem;

    &:first-of-type {
      background: $gray-1;
      color: $gray-2;
      box-shadow: none;

      &:hover {
        filter: brightness(0.95);
      }
    }
  }
</style>
