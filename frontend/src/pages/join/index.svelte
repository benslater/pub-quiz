<script>
  import { navigateTo } from "svelte-router-spa";
  import { role, ROLES } from "../../stores";

  export let currentRoute;
  export let params;

  let gameId = "";
  let name = "";

  const goToGame = () => {
    role.set(ROLES.PLAYER);
    navigateTo(`/game/${gameId}`);
  };
</script>

<style>

</style>

<div>
  <h2>Enter game ID:</h2>
  <div class="form-group">
    <label for="gameId">Game ID:</label>
    <input
      bind:value={gameId}
      type="text"
      placeholder="Enter game ID..."
      id="gameId" />
  </div>

  <div class="form-group">
    <label for="name">Name:</label>
    <input
      bind:value={name}
      type="text"
      placeholder="Enter name..."
      id="name" />
  </div>

  <button disabled={!gameId.match(/\w-\w/) && name !== ''} on:click={goToGame}>
    Join game
  </button>
</div>
