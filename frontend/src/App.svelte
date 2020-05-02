<script>
  import { Router } from "svelte-router-spa";
  import { routes } from "./routes";
</script>

<style>
  main {
    height: 100vh;
    width: 100vw;

    padding: 0 20px;
  }
</style>

<main>
  <Router {routes} />
</main>
