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

    res.send(
      await Game.findOne({ id }).populate("players").populate("questions")
    );
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

    const game = await Game.findOne({ id }).populate("players");
    if (!game) {
      // TODO: Conditional logic that includes host
      //  || !game.players.find((player) => player.name === name)
      return res.notFound();
    }

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

    const { questionIndex } = await Game.findOne({ id });

    await Game.updateOne({ id }).set({
      questionIndex: questionIndex + 1,
    });
    const game = await Game.findOne({ id })
      .populate("players")
      .populate("questions");

    sails.sockets.broadcast(id, "gameUpdate", { game });
    res.send();
  },
};
