<script>
  import { Navigate } from "svelte-router-spa";

  export let currentRoute;
  export let params;
</script>

<style>
  .homepage {
    height: 100%;
    width: 100%;

    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
  }

  .button-container {
    width: 50%;
    max-width: 500px;
  }

  button {
    height: 100%;
    width: 100%;
  }

  .about {
    position: absolute;
    bottom: 20px;

    text-align: center;
  }
</style>

<div class="homepage">
  <div class="button-container">
    <Navigate to="/setup">
      <button>Start new game</button>
    </Navigate>
  </div>

  <div class="button-container">
    <Navigate to="/join">
      <button>Join game</button>
    </Navigate>
  </div>

  <div class="about">
    Made by
    <a class="text-secondary" href="http://benslater.tech">Ben Slater</a>
    using
    <a class="text-secondary" href="https://svelte.dev/">Svelte,</a>
    <a class="text-secondary" href="https://sailsjs.com/">Sails.js,</a>
    and
    <a class="text-secondary" href="https://www.getpapercss.com">Paper CSS</a>
  </div>
</div>
