<script>
  export let players = [];
</script>

<style>
  h3 {
    margin: 0 0 20px 0;
  }
</style>

<div>
  <h3>Players:</h3>
  {#each players as player}
    <ul>
      <li>{player.name}</li>
    </ul>
  {/each}
</div>
