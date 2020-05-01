const uuid4 = require("uuid").v4;
const randomWords = require("random-words");

/**
 * GameController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  create: async (req, res) => {
    const {
      body: { rounds },
    } = req;

    // Create a new game, with a random ID and default state.
    // TODO: Extract default state to a separate constant (maybe in models file?)
    const id = randomWords(2).join("-");
    await Game.create({
      id,
      state: {
        started: false,
        round: 0,
        question: 0,
      },
    }).fetch();

    // Create an empty round for each round submitted by client
    const createdRounds = await Promise.all(
      rounds.map(async () =>
        Round.create({
          id: uuid4(),
          game: id,
        }).fetch()
      )
    );

    // For each round created in the db, create all questions, according to the questions submitted
    // by the client.
    await Promise.all(
      createdRounds.map((round, index) =>
        Promise.all(
          rounds[index].map((question) =>
            Question.create({
              id: uuid4(),
              round: round.id,
              question: question.question,
              answer: question.answer,
            })
          )
        )
      )
    );

    // Retrieve the now-complete game, populating players (empty at this point), and rounds.
    const gameResponse = await Game.findOne({ id })
      .populate("players")
      .populate("rounds");

    // Waterline cannot populate the questions on the retrieved rounds (TODO: can it actually?)
    // For each created round, find the questions in the db that are associated to its ID,
    // and set that property on the response object.
    const questions = await Promise.all(
      createdRounds.map((round) => Question.find({ round: round.id }))
    );
    gameResponse.rounds = gameResponse.rounds.map((round, index) => ({
      ...round,
      questions: questions[index],
    }));

    // Send the completed game back.
    // TODO: Is this actually useful? (other than for debugging...) Do we need to know more than
    // the fact that it succeeded? We'll be retrieving the whole game object via websocket later...
    res.send(gameResponse);
  },

  find: async (req, res) => {
    const {
      params: { id },
    } = req;

    res.send(await sails.helpers.getFullyPopulatedGame(id));
  },

  findAll: async (_, res) => {
    res.send(await Game.find());
  },

  purge: async (_, res) => {
    res.send(await Game.destroy({}));
  },

  setQuestions: async (req, res) => {
    const {
      params: { id: gameId },
      body: { questions },
    } = req;
    const id = uuid4();

    const response = await Promise.all(
      questions.map(({ question, answer }) =>
        Question.create({ id, gameId, question, answer }).fetch()
      )
    );

    res.send(response);
  },

  join: async (req, res) => {
    const {
      params: { id },
    } = req;

    if (!req.isSocket) {
      return res.badRequest();
    }
    
    const game = await sails.helpers.getFullyPopulatedGame(id);
    if (!game) {
      // TODO: Conditional logic that includes host
      //  || !game.players.find((player) => player.name === name)
      return res.notFound();
    }

    // game.rounds = await Round.find({ game: game.id }).populate("questions");

    sails.sockets.join(req, id);
    sails.sockets.broadcast(id, "gameUpdate", { game });
  },

  open: async (req, res) => {
    const {
      params: { id },
    } = req;

    res.send(await Game.updateOne({ id }).set({ open: true }).fetch());
  },

  next: async (req, res) => {
    const {
      params: { id },
    } = req;

    let game = await Game.findOne({ id }).populate("rounds");
    if (!game) {
      return res.notFound();
    }

    // If game hasn't started, set `started` to true and other state to default. Broadcast and return.
    if (!game.state.started) {
      await Game.updateOne({ id }).set({
        state: {
          started: true,
          round: 0,
          question: 0,
          endOfRound: false,
        },
      });

      // TODO: This seems to be becoming a common pattern. Pull into helper. `broadcastGameAndSendRes(res)`
      game = await sails.helpers.getFullyPopulatedGame(id);
      sails.sockets.broadcast(id, "gameUpdate", { game });
      return res.send();
    }
    // If game is end of round, set `endOfRound` to false and other state to current.
    // Broadcast and return.
    if (game.state.endOfRound) {
      await Game.updateOne({ id }).set({
        state: {
          ...game.state,
          endOfRound: false,
        },
      });

      game = await sails.helpers.getFullyPopulatedGame(id);
      sails.sockets.broadcast(id, "gameUpdate", { game });
      return res.send();
    }

    // If game is last question in round, increment round, reset question, and set endOfRound.
    // If last question of last round, set state.gameOver
    // Broadcast and return;
    const currentRound = await Round.findOne({
      id: game.rounds[game.state.round].id,
    }).populate("questions");
    if (game.state.question === currentRound.questions.length - 1) {
      await Game.updateOne({ id }).set({
        state: {
          ...game.state,
          round: game.state.round + 1,
          question: 0,
          endOfRound: true,
          gameOver: game.state.round === game.rounds.length - 1,
        },
      });

      game = await sails.helpers.getFullyPopulatedGame(id);
      sails.sockets.broadcast(id, "gameUpdate", { game });
      return res.send();
    }

    // Otherwise, increment question. Broadcast and return.
    await Game.updateOne({ id }).set({
      state: {
        ...game.state,
        question: game.state.question + 1,
      },
    });

    game = await sails.helpers.getFullyPopulatedGame(id);

    sails.sockets.broadcast(id, "gameUpdate", { game });
    return res.send();
  },

  answer: async (req, res) => {
    const {
      params: { id },
      body: { playerId, questionId, answer },
    } = req;

    let game = await Game.findOne({ id })
      .populate("players")
      .populate("rounds");
    if (!game) {
      return res.notFound();
    }
    const question = await Question.findOne({ id: questionId });
    if (!question) {
      return res.notFound();
    }

    const player = await Player.findOne({ id: playerId });
    if (!player) {
      return res.notFound();
    }

    await PlayerAnswer.create({
      id: uuid4(),
      player: player.id,
      question: question.id,
      answer,
    });

    game = await sails.helpers.getFullyPopulatedGame(id);

    sails.sockets.broadcast(id, "gameUpdate", { game });
    res.send();
  },

  mark: async (req, res) => {
    const {
      params: { id, answerId },
      body: { result },
    } = req;

    const answer = PlayerAnswer.findOne({ id: answerId });
    if (!answer) {
      res.notFound();
    }

    await PlayerAnswer.updateOne({ id: answerId }).set({ result });

    const game = await sails.helpers.getFullyPopulatedGame(id);
    sails.sockets.broadcast(id, "gameUpdate", { game });
  },
};
