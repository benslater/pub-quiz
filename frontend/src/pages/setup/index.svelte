<script>
  import { navigateTo } from "svelte-router-spa";
  import { role, ROLES } from "../../stores";

  export let currentRoute;
  export let params;

  let questions = [{}];

  const addQuestion = () => {
    questions = [...questions, {}];
    console.log(questions);
  };

  const createGame = async () => {
    const res = await fetch("http://localhost:1337/game/create", {
      method: "POST",
      body: JSON.stringify({
        questions
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
  {#each questions as question, index}
    <div class="row">
      <div class="col sm-1">{index + 1})</div>
      <div class="col sm-5">
        <div class="form-group">
          <label for={`question-input-${index + 1}`}>Question:</label>
          <input
            bind:value={questions[index].question}
            class="input-block"
            type="text"
            id={`question-input-${index + 1}`} />
        </div>
      </div>
      <div class="col sm-5">
        <div class="form-group">
          <label for={`answer-input-${index + 1}`}>Answer:</label>
          <input
            bind:value={questions[index].answer}
            class="input-block"
            type="text"
            id={`answer-input-${index + 1}`} />
        </div>
      </div>
      <div class="col sm-1">DELETE</div>
    </div>
  {/each}
  <button on:click={addQuestion}>Add question</button>
  <button on:click={createGame}>Create game</button>
</div>
