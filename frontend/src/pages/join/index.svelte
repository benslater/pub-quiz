<script>
  import { navigateTo } from "svelte-router-spa";
  import { v4 as uuid4 } from "uuid";
  import { role, player, ROLES } from "../../stores";

  export let currentRoute;
  export let params;

  let gameId = "";
  let name = "";

  const goToGame = async () => {
    role.set(ROLES.PLAYER);
    const res = await fetch("http://localhost:1337/player/create", {
      method: "POST",
      body: JSON.stringify({
        name,
        gameId
      })
    });
    const { id } = await res.json();
    player.set({ id, name });
    navigateTo(`/game/${gameId}`);
  };

  // TODO: Recover into disconnected game
  // TODO: Better player identity (e.g. FB/Google)
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
