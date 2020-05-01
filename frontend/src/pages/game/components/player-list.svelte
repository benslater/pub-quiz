<script>
  export let players = [];
</script>

<style>

</style>

<div>
  {#each players as player}
    <div>{player.name}</div>
  {/each}
</div>
