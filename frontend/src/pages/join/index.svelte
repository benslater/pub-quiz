<script>
  import { navigateTo } from "svelte-router-spa";
  import { v4 as uuid4 } from "uuid";
  import { role, player, ROLES } from "../../stores";
  import request from "../../utils/request";
  export let currentRoute;
  export let params;

  let gameId = "";
  let name = "";

  $: isJoinDisabled = !gameId.match(/\w-\w/) || name === "";

  const goToGame = async () => {
    role.set(ROLES.PLAYER);
    const res = await request("http://localhost:3000/api/player/create", {
      method: "POST",
      body: {
        name,
        gameId: gameId.toLowerCase()
      }
    });
    const { id } = await res.json();
    player.set({ id, name });
    navigateTo(`/game/${gameId}`);
  };

  // TODO: Recover into disconnected game
  // TODO: Better player identity (e.g. FB/Google)

  const lowercaseInput = input => {
    gameId = input.toLowerCase();
  };
</script>

<style>
  /* A LOT of duplication here. Look into svelte layout */
  h2 {
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: center;

    margin: 0;
  }

  .join-page {
    position: relative;

    display: flex;
    flex-direction: column;

    width: 100%;
    height: 100%;
  }

  .inputs {
    display: flex;
    align-items: center;
    flex: 4;
    flex-direction: column;
    justify-content: center;
  }

  .bottom-section {
    display: flex;
    align-items: center;
    flex: 1;
    flex-direction: column;
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
        on:input={lowercaseInput(gameId)}
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
