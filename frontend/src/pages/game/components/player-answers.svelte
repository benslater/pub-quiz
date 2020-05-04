<script>
  export let answers = [];
  export let onMarkAnswer;
</script>

<style>
  button {
    margin: 0;
    padding: 0;
    height: 50px;
    width: 50px;
  }
  .row {
    align-items: center;
    justify-content: space-evenly;

    padding: 0;
    margin: 0;
  }
</style>

<div>
  {#each answers as answer}
    <div class="row">
      <div class="col col-6">{answer.answer}</div>
      <!-- {#if answer.result === ''} -->
      <div class="col col-6 row">
        <button
          class:background-success={answer.result === 'CORRECT'}
          on:click={() => onMarkAnswer(answer.id, 'CORRECT')}>
          ✔
        </button>
        <button
          class:background-danger={answer.result === 'INCORRECT'}
          on:click={() => onMarkAnswer(answer.id, 'INCORRECT')}>
          ✘
        </button>
      </div>
      <!-- {:else} -->
      <!-- {/if} -->
    </div>
  {/each}
</div>
