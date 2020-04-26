<script>
  import { navigateTo } from "svelte-router-spa";
  import { role, ROLES } from "../../stores";

  export let currentRoute;
  export let params;

  let rounds = [[{}]];

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

</style>

<div>
  <h2>Enter questions and answers</h2>
  {#each rounds as questions, roundIndex}
    <div class="card">
      <h3>Round {roundIndex + 1}</h3>
      {#each questions as question, questionIndex}
        <div class="row">
          <div class="col sm-1">{questionIndex + 1})</div>
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
          <button class="col sm-1">x</button>
        </div>
      {/each}
      <button on:click={() => addQuestion(roundIndex)}>Add question</button>
    </div>
  {/each}
  <button on:click={addRound}>Add round</button>
  <button on:click={createGame}>Create game</button>
</div>
