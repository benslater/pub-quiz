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
    const game = await Game.findOne({ gameId });

    if (!game) {
      return res.notFound();
    }

    res.send(await Player.create({ game: game.id, name, answers: [] }).fetch());
  },
};
