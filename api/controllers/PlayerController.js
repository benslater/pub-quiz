const uuid4 = require("uuid").v4;

/**
 * PlayerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  create: async (req, res) => {
    const {
      body: { name, gameId },
    } = req;
    const id = uuid4();
    const game = await Game.find({ id: gameId });

    if (!game) {
      return res.notFound();
    }

    res.send(await Player.create({ id, name, gameId, game: gameId }).fetch());
  },
  find: async (req, res) => {
    const {
      params: { id },
    } = req;

    res.send(await Player.find({ id }));
  },
  findAll: async (_, res) => {
    res.send(await Player.find());
  },
  purge: async (_, res) => {
    res.send(await Player.destroy({}));
  },
};
