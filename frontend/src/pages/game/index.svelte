<script>
  import { onMount } from "svelte";

  import PlayerList from "./components/player-list.svelte";
  import PlayerScores from "./components/player-scores.svelte";
  import PlayerAnswers from "./components/player-answers.svelte";
  import AnswerInput from "./components/answer-input.svelte";
  import LoadingDots from "../../components/loading-dots/index.svelte";

  import { game, role, ROLES, player } from "../../stores.js";

  export let currentRoute;
  export let params;

  let answer = "";
  let titleText =
    $role === ROLES.HOST
      ? "Waiting for players to join..."
      : "Waiting for game to start...";
  // TODO: Base this off a response from the websocket
  let answerSubmitted = false;
  let currentRoundIndex = 0;
  let currentQuestionIndex = 0;

  $: isGameStarted = $game && $game.state && $game.state.started;
  $: isGameOver = $game && $game.state && $game.state.gameOver;
  $: isEndOfRound = $game && $game.state && $game.state.endOfRound;
  $: players = ($game && $game.players) || [];
  $: roundIndex = $game && $game.state ? $game.state.round : undefined;
  $: questionIndex = $game && $game.state ? $game.state.question : undefined;
  $: currentRound =
    ($game && $game.rounds && $game.rounds[roundIndex]) || undefined;
  $: currentQuestion =
    (currentRound && currentRound.questions[questionIndex]) || undefined;
  $: playerAnswers = (currentQuestion && currentQuestion.playerAnswers) || [];
  $: nextDisabled =
    !players.length || (isGameStarted && playerAnswers.length < players.length);

  const {
    namedParams: { id: gameId }
  } = currentRoute;

  onMount(async () => {
    io.socket.on("gameUpdate", data => {
      game.set(data.game);
      console.log($game);

      // TODO: Move into template, just use $game.state to compute title.
      if ($game.state.started) {
        console.log($game);
        titleText = `Round ${roundIndex + 1}: Question ${questionIndex + 1}`;
      }
      if ($game.state.finished) {
        titleText = "Final scores:";
      }
      if ($game.state.endOfRound) {
        titleText = "End of round!";
      }
      if ($game.state.gameOver) {
        titleText = "Game over!";
      }

      if (currentRoundIndex !== roundIndex) {
        currentRoundIndex = roundIndex;
        answerSubmitted = false;
      }
      if (currentQuestionIndex !== $game.state.question) {
        currentQuestionIndex = $game.state.question;
        answerSubmitted = false;
      }
    });
    io.socket.get(`localhost:1337/game/${gameId}/join`);
  });

  const nextQuestion = () =>
    io.socket.post(`localhost:1337/game/${gameId}/next`);

  const submitAnswer = answer => {
    answerSubmitted = true;
    io.socket.post(`localhost:1337/game/${gameId}/answer`, {
      playerId: $player.id,
      questionId: $game.rounds[roundIndex].questions[questionIndex].id,
      answer
    });
  };

  const markAnswer = (answerId, result) => {
    io.socket.post(`localhost:1337/game/${gameId}/answer/${answerId}/mark`, {
      result
    });
  };
</script>

<style>
  h2 {
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: center;

    margin: 0;
  }

  .game-page {
    position: relative;

    display: flex;
    flex-direction: column;

    width: 100%;
    height: 100%;
  }

  .main-section {
    display: flex;
    overflow: auto;
    flex: 4;
    flex-direction: column;

    padding: 20px 0 0 0;
  }

  .question-answer-text {
    display: flex;
    align-items: center;
    flex: 1;

    margin: 0 20px;
  }

  .answer-input {
    flex: 2;
  }

  .player-list {
    flex: 2;
  }
  .player-answers {
    flex: 2;
  }

  .player-scores {
    flex: 2;
  }

  .bottom-section {
    display: flex;
    align-items: center;
    flex: 1;
    flex-direction: column;
    justify-content: center;

    width: 100%;
  }

  .start-next-button {
    width: 100%;
    max-width: 500px;
  }

  @media (min-width: 768px) {
    .main-section {
      width: 500px;
      margin: auto;
    }
  }
</style>

<div class="game-page">
  <h2 class="title">{titleText}</h2>
  <div class="main-section">
    <!-- TODO: Optional chaining support in rollup/eslint? $game?.state?.started-->
    {#if isGameStarted}
      {#if !isEndOfRound}
        <h4>Question:</h4>
        <div class="question-answer-text">{currentQuestion.question}</div>
        {#if $role === ROLES.HOST}
          <h4>Answer:</h4>
          <div class="question-answer-text">{currentQuestion.answer}</div>
        {/if}
        {#if $role === ROLES.PLAYER}
          <div class="answer-input">
            <AnswerInput
              enabled={!answerSubmitted}
              gameStateAnswer={$game.state.answer}
              onSubmit={submitAnswer} />
          </div>
        {:else}
          <div class="player-answers">
            <PlayerAnswers answers={playerAnswers} onMarkAnswer={markAnswer} />
          </div>
        {/if}
      {:else if $game && $game.state && ($game.state.endOfRound || $game.state.gameOver) && players && players.length}
        <div class="player-scores">
          <PlayerScores {players} />
        </div>
      {/if}
    {:else}
      <div class="player-list">
        <PlayerList {players} />
      </div>
      {#if $role === ROLES.PLAYER}
        <div class="bottom-section">
          <div>Waiting for host to start game</div>
          <LoadingDots />
        </div>
      {/if}
    {/if}
  </div>
  {#if $role === ROLES.HOST && !($game && $game.state && $game.state.gameOver)}
    <div class="bottom-section">
      <button
        class="start-next-button"
        class:background-success={!nextDisabled}
        disabled={nextDisabled}
        on:click={nextQuestion}>
        {$game && $game.state && $game.state.started ? 'Next Question' : 'Start Game'}
      </button>
    </div>
  {/if}
</div>
