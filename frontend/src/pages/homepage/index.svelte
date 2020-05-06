<script>
  import { onMount } from "svelte";
  import { Navigate, navigateTo } from "svelte-router-spa";
  import Cookies from "js-cookie";

  import { game, player, role, ROLES } from "../../stores";

  export let currentRoute;
  export let params;
  const gameInProgress = Cookies.getJSON("gameInProgress");

  onMount(() => {
    if (gameInProgress) {
      document.getElementById("reconnect-modal").click();
    }
  });

  const rejoinGame = () => {
    if (gameInProgress.role === ROLES.HOST) {
      role.set(ROLES.HOST);
    } else {
      player.set(gameInProgress.player);
      role.set(ROLES.PLAYER);
    }
    navigateTo(`/game/${gameInProgress.game.gameId}`);
  };
</script>

<style>
  .homepage {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: space-evenly;

    width: 100%;
    height: 100%;
  }

  .button-container {
    width: 55%;
    max-width: 500px;
  }

  button {
    width: 100%;
    height: 100%;
  }

  .about {
    position: absolute;
    bottom: 20px;

    text-align: center;
  }
</style>

<div class="homepage">
  <input class="modal-state" id="reconnect-modal" type="checkbox" />
  <div class="modal">
    <label class="modal-bg" for="reconnect-modal" />
    <div class="modal-body">
      <label class="btn-close" for="reconnect-modal">X</label>
      <h4 class="modal-title">It looks like you have a game in progress!</h4>
      <!-- <h5 class="modal-subtitle">Modal Subtitle</h5> -->
      <p class="modal-text">
        Do you want to rejoin the game
        <span class="text-muted">
          {gameInProgress && gameInProgress.game.gameId}
        </span>
        ?
      </p>
      <button on:click={rejoinGame}>Rejoin</button>
      <label for="reconnect-modal" class="paper-btn">Close</label>
    </div>
  </div>
  <div class="button-container">
    <Navigate to="/setup">
      <button>Start new game</button>
    </Navigate>
  </div>

  <div class="button-container">
    <Navigate to="/join">
      <button>Join game</button>
    </Navigate>
  </div>

  <div class="about">
    Made by
    <a class="text-secondary" href="http://benslater.tech">Ben Slater</a>
    using
    <a class="text-secondary" href="https://svelte.dev/">Svelte,</a>
    <a class="text-secondary" href="https://sailsjs.com/">Sails.js,</a>
    and
    <a class="text-secondary" href="https://www.getpapercss.com">Paper CSS</a>
  </div>
</div>
