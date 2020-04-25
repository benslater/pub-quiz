<script>
  import { onMount } from "svelte";
  import { game, role, ROLES } from "../../stores.js";

  export let currentRoute;
  export let params;
  let gameValue = {
    questionIndex: -1
  };

  const {
    namedParams: { id: gameId }
  } = currentRoute;
  const name = "Player One";
  let titleText = "Waiting for game to start...";

  game.subscribe(val => {
    gameValue = val;
  });

  onMount(async () => {
    // await fetch("http://localhost:1337/player/create", {
    //   method: "POST",
    //   mode: "no-cors",
    //   body: JSON.stringify({
    //     name,
    //     gameId
    //   })
    // });
    io.socket.on("gameUpdate", data => {
      game.set(data.game);
      console.log(gameValue);

      if (gameValue.questionIndex === gameValue.questions.length) {
        titleText = "Final scores:";
      }
      if (gameValue.questionIndex > -1) {
        titleText = `Question ${gameValue.questionIndex + 1}`;
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

  {#if gameValue && gameValue.questionIndex === -1}
    {#if gameValue && gameValue.players && gameValue.players.length}
      {#each gameValue.players as player}
        <div>{player.name}</div>
      {/each}
    {/if}
    <button on:click={joinp2}>CLICKY</button>
    <!-- TODO: Animate the dots -->
    <div>...</div>
  {/if}

  {#if gameValue && gameValue.questionIndex > -1}
    {gameValue.questions[gameValue.questionIndex].question}
  {/if}

  {#if $role === ROLES.HOST}
    <button on:click={nextQuestion}>
      {gameValue && gameValue.questionIndex > -1 ? 'Next Question' : 'Start Game'}
    </button>
  {/if}
</div>
