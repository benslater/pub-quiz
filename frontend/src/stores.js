import { writable } from "svelte/store";

export const ROLES = {
  PLAYER: "PLAYER",
  HOST: "HOST",
};

export const game = writable({});
export const role = writable(ROLES.HOST);
export const player = writable({ id: "", name: "" });
