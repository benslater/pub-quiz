<script>
  import { navigateTo } from "svelte-router-spa";
  import { v4 as uuid4 } from "uuid";
  import { role, player, ROLES } from "../../stores";

  export let currentRoute;
  export let params;

  let gameId = "";
  let name = "";

  $: isJoinDisabled = !gameId.match(/\w-\w/) || name === "";

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
  /* A LOT of duplication here. Look into svelte layout */
  h2 {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;

    margin: 0;
  }

  .join-page {
    display: flex;
    flex-direction: column;

    position: relative;

    height: 100%;
    width: 100%;
  }

  .inputs {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 4;
  }

  .bottom-section {
    display: flex;
    flex-direction: column;
    flex: 1;
    align-items: center;
    justify-content: center;

    width: 100%;
  }

  button {
    width: 100%;
    max-width: 500px;
  }
</style>

<div class="join-page">
  <h2>Enter game ID:</h2>

  <div class="inputs">
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
  </div>

  <div class="bottom-section">
    <button
      class:background-success={!isJoinDisabled}
      disabled={isJoinDisabled}
      on:click={goToGame}>
      Join game
    </button>
  </div>
</div>
