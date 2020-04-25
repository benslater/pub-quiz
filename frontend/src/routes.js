import Homepage from "./pages/homepage/index.svelte";
import Setup from "./pages/setup/index.svelte";
import Join from "./pages/join/index.svelte";
import Game from "./pages/game/index.svelte";

const userIsAdmin = () => {
  //check if user is admin and returns true or false
};

const routes = [
  {
    name: "/",
    component: Homepage,
  },
  {
    name: "/setup",
    component: Setup,
  },
  {
    name: "/join",
    component: Join,
  },
  {
    name: "/game/:id",
    component: Game,
  },
];

export { routes };
