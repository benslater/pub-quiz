<script>
  import { onMount } from "svelte";
  import { game, role, ROLES, player } from "../../stores.js";

  export let currentRoute;
  export let params;
  let answer = "";
  let titleText = "Waiting for game to start...";
  // TODO: Base this off a response from the websocket
  let answerSubmitted = false;
  let currentRound = 0;
  let currentQuestion = 0;

  const {
    namedParams: { id: gameId }
  } = currentRoute;

  onMount(async () => {
    io.socket.on("gameUpdate", data => {
      game.set(data.game);
      console.log($game);

      // TODO: Move into template, just use $game.state to compute title.
      // TODO: Add round title as well
      if ($game.finished) {
        titleText = "Final scores:";
      } else if ($game.state.started) {
        titleText = `Question ${$game.state.question + 1}`;
      }

      if (currentRound !== $game.state.round) {
        currentRound = $game.state.round;
        answerSubmitted = false;
      }
      if (currentQuestion !== $game.state.question) {
        currentQuestion = $game.state.question;
        answerSubmitted = false;
      }
    });
    io.socket.get(`localhost:1337/game/${gameId}/join`);
  });

  const nextQuestion = () =>
    io.socket.post(`localhost:1337/game/${gameId}/next`);

  const submitAnswer = () => {
    answerSubmitted = true;
    io.socket.post(`localhost:1337/game/${gameId}/answer`, {
      name: $player.name,
      questionId:
        $game.rounds[$game.state.round].questions[$game.state.question].id,
      answer
    });
  };
</script>

<style>

</style>

<div>
  <h2>{titleText}</h2>
  <!-- TODO: Optional chaining support in rollup/eslint? $game?.state?.started-->
  {#if $game && $game.state && $game.state.started}
    <div>
      {$game.rounds[$game.state.round].questions[$game.state.question].question}
    </div>
    {#if $role === ROLES.PLAYER}
      <div class="row">
        <div class="col sm-6">
          {#if !answerSubmitted}
            <div class="form-group">
              <label for={`answer-input-${$game.state.answer}`}>Answer:</label>
              <input
                id={`answer-input-${$game.state.answer}`}
                class="input-block"
                type="text"
                bind:value={answer} />
            </div>
          {:else}
            <div>{answer}</div>
          {/if}
        </div>
      </div>
      <button disabled={answerSubmitted} on:click={submitAnswer}>
        {answerSubmitted ? 'Waiting for next question...' : 'Submit'}
      </button>
    {/if}
  {:else}
    {#if $game && $game.players && $game.players.length}
      {#each $game.players as player}
        <div>{player.name}</div>
      {/each}
    {/if}
    <!-- TODO: Animate the dots -->
    <div>...</div>
  {/if}
  {#if $role === ROLES.HOST}
    <button on:click={nextQuestion}>
      {$game && $game.state && $game.state.started ? 'Next Question' : 'Start Game'}
    </button>
  {/if}
</div>
