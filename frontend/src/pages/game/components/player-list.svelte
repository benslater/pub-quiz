<script>
  export let players = [];
</script>

<style>

</style>

<div>
  <h3>Players:</h3>
  {#each players as player}
    <ul>
      <li>{player.name}</li>
    </ul>
  {/each}
</div>
