<script>
  export let answers = [];
  export let onMarkAnswer;
</script>

<style>

</style>

<div>
  {#each answers as answer}
    <p>{answer.answer}</p>
    {#if answer.result === ''}
      <button on:click={() => onMarkAnswer(answer.id, 'CORRECT')}>RIGHT</button>
      <button on:click={() => onMarkAnswer(answer.id, 'INCORRECT')}>
        WRONG
      </button>
    {:else}
      <p>{answer.result}</p>
    {/if}
  {/each}
</div>
