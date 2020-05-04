<script>
  export let enabled;
  export let gameStateAnswer = 0;
  export let onSubmit;

  let answer;
</script>

<style>
  .answer-input {
    display: flex;
  }

  .row {
    flex: 1;
  }

  .submit-button {
    width: 100%;
  }
</style>

<div class="answer-input">
  <div class="row">
    <div class="col col-fill">
      <div class="form-group">
        <label for={`answer-input-${gameStateAnswer}`}>Answer:</label>
        <input
          id={`answer-input-${gameStateAnswer}`}
          class="input-block"
          type="text"
          bind:value={answer}
          disabled={!enabled} />
      </div>
      <button
        class="submit-button"
        class:background-success={enabled}
        disabled={!enabled}
        on:click={() => onSubmit(answer)}>
        {!enabled ? 'Waiting for next question...' : 'Submit'}
      </button>
    </div>
  </div>
</div>
