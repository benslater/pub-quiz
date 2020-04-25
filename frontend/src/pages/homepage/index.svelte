<script>
  import { Navigate } from "svelte-router-spa";

  export let currentRoute;
  export let params;
</script>

<style>

</style>

<div>
  <Navigate to="/setup">
    <button>Start new game</button>
  </Navigate>

  <Navigate to="/join">
    <button>Join game</button>
  </Navigate>
</div>
