<script>
  export let enabled;
  export let gameStateAnswer = 0;
  export let onSubmit;

  let answer;
</script>

<style>

</style>

<div class="row">
  <div class="col sm-6">
    {#if enabled}
      <div class="form-group">
        <label for={`answer-input-${gameStateAnswer}`}>Answer:</label>
        <input
          id={`answer-input-${gameStateAnswer}`}
          class="input-block"
          type="text"
          bind:value={answer} />
      </div>
    {:else}
      <div>{answer}</div>
    {/if}
    <button disabled={!enabled} on:click={() => onSubmit(answer)}>
      {!enabled ? 'Waiting for next question...' : 'Submit'}
    </button>
  </div>
</div>
