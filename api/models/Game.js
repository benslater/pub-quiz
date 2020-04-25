/**
 * Game.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    // id: {
    //   type: "string",
    //   required: true,
    // },
    // open: {
    //   type: "boolean",
    //   required: true,
    // },
    // questionIndex: {
    //   type: "number",
    //   required: true,
    // },
    // // questions: {
    // //   collection: "question",
    // //   via: "game",
    // // },
    // players: {
    //   collection: "player",
    //   via: "game",
    // },
    // rounds: {
    //   collection: "round",
    //   via: "game",
    // },
    id: {
      type: "string",
      required: true,
    },
    players: {
      collection: "player",
      via: "game",
    },
    rounds: {
      collection: "round",
      via: "game",
    },
    state: {
      type: "json",
    },
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
  },
};
