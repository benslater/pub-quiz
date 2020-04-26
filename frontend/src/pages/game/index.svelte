<script>
  import { onMount } from "svelte";
  import { game, role, ROLES } from "../../stores.js";

  export let currentRoute;
  export let params;
  let gameValue;

  const {
    namedParams: { id: gameId }
  } = currentRoute;
  const name = "Player One";
  let titleText = "Waiting for game to start...";

  game.subscribe(val => {
    gameValue = val;
  });

  onMount(async () => {
    io.socket.on("gameUpdate", data => {
      game.set(data.game);
      console.log(gameValue);

      // TODO: Move into template, just use gameValue.state to compute title.
      // TODO: Add round title as well
      if (gameValue.finished) {
        titleText = "Final scores:";
      } else if (gameValue.state.started) {
        titleText = `Question ${gameValue.state.question + 1}`;
      }
    });
    io.socket.post(`localhost:1337/game/${gameId}/join`, {
      name
    });
  });

  const joinp2 = async () => {
    await fetch("http://localhost:1337/player/create", {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        name: "Player Two",
        gameId
      })
    });
    io.socket.post(`localhost:1337/game/${gameId}/join`, {
      name: "Player Two"
    });
  };

  const nextQuestion = () =>
    io.socket.post(`localhost:1337/game/${gameId}/next`);
</script>

<style>

</style>

<div>
  <h2>{titleText}</h2>

  <!-- TODO: Optional chaining support in rollup/eslint? -->
  {#if gameValue && gameValue.state && gameValue.state.started}
    <div />
  {:else}
    {#if gameValue && gameValue.players && gameValue.players.length}
      {#each gameValue.players as player}
        <div>{player.name}</div>
      {/each}
    {/if}
    <button on:click={joinp2}>CLICKY</button>
    <!-- TODO: Animate the dots -->
    <div>...</div>
  {/if}

  {#if $role === ROLES.HOST}
    <button on:click={nextQuestion}>
      {gameValue && gameValue.state && gameValue.state.started ? 'Next Question' : 'Start Game'}
    </button>
  {/if}
</div>
