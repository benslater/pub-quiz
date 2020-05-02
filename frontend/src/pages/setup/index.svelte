<script>
  import { navigateTo } from "svelte-router-spa";
  import { role, ROLES } from "../../stores";

  export let currentRoute;
  export let params;

  let rounds = [[{}]];
  let width = 0;
  $: isMobile = width < 768;

  const addQuestion = roundIndex => {
    rounds[roundIndex] = [...rounds[roundIndex], {}];
  };

  const addRound = () => {
    rounds = [...rounds, [{}]];
  };

  const createGame = async () => {
    const res = await fetch("http://localhost:1337/game/create", {
      method: "POST",
      body: JSON.stringify({
        rounds
      })
    });
    const { id } = await res.json();

    role.set(ROLES.HOST);
    navigateTo(`/game/${id}`);
  };
</script>

<style>
  hr {
    margin-top: 40px;
  }
  .add-question-separator {
    margin: 40px 0;
  }
  .add-question-button-container {
    display: flex;
    justify-content: center;
  }
  .card {
    margin-bottom: 20px;
  }
  .add-question {
    width: 100%;
    max-width: 500px;
  }

  .bottom-buttons {
    display: flex;
    margin-bottom: 20px;
  }

  .bottom-buttons button {
    flex: 1;
    margin: 0 20px;
  }
</style>

<svelte:window bind:innerWidth={width} />

<div>
  <h2>Enter questions and answers</h2>
  {#each rounds as questions, roundIndex}
    <div class="card">
      <div class="card-body">
        <h3 class="">Round {roundIndex + 1}</h3>
        {#each questions as question, questionIndex}
          {#if questionIndex > 0}
            <hr />
          {/if}
          <div class="row">
            <h4 class="col sm-1">Q{questionIndex + 1}:</h4>
            <div class="col sm-5">
              <div class="form-group">
                <label for={`question-input-${questionIndex + 1}`}>
                  Question:
                </label>
                <input
                  bind:value={questions[questionIndex].question}
                  class="input-block"
                  type="text"
                  id={`question-input-${questionIndex + 1}`} />
              </div>
            </div>
            <div class="col sm-5">
              <div class="form-group">
                <label for={`answer-input-${questionIndex + 1}`}>Answer:</label>
                <input
                  bind:value={questions[questionIndex].answer}
                  class="input-block"
                  type="text"
                  id={`answer-input-${questionIndex + 1}`} />
              </div>
            </div>
            <button class="col sm-1 background-danger">
              {isMobile ? 'Delete question' : 'x'}
            </button>
          </div>
        {/each}
        <hr class="add-question-separator" />
        <div class="add-question-button-container">
          <button
            class="add-question background-primary"
            on:click={() => addQuestion(roundIndex)}>
            Add question
          </button>
        </div>
      </div>
    </div>
  {/each}
  <div class="bottom-buttons">
    <button class="background-secondary" on:click={addRound}>Add round</button>
    <button class="background-success" on:click={createGame}>
      Create game
    </button>
  </div>
</div>
