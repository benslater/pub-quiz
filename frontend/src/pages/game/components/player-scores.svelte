<script>
  export let players = [];
</script>

<style>

</style>

<div>
  <div>SCORES:</div>
  {#each players as player}
    <p>
      {player.name}: {player.answers.filter(answer => answer.result === 'CORRECT').length}
    </p>
  {/each}
</div>
