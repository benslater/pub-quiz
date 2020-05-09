<script>
  import { Router } from "svelte-router-spa";
  import { routes } from "./routes";
  // If these aren't imported here, rollup won't replace the http://localhost:3000
  // TODO: Fix better
  import request from "./utils/request";
  import socket from "./utils/socket";
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
