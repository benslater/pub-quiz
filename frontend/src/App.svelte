<script>
  import { Router } from "svelte-router-spa";
  import { routes } from "./routes";
</script>

<style>
  main {
    width: 100vw;
    height: 100vh;
    padding: 0 20px;
  }

  @media (min-width: 768px) {
    main {
      padding: 0 50px;
    }
  }
</style>

<main>
  <Router {routes} />
</main>
