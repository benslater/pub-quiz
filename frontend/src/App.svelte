<script>
  import { Router } from "svelte-router-spa";
  import { routes } from "./routes";

  export let name;
</script>

<style>

</style>

<main>
  <Router {routes} />
</main>
