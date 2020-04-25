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
    // const {
    //   body: { questions },
    // } = req;
    // const id = randomWords(2).join("-");

    // await Game.create({
    //   id,
    //   open: false,
    //   questionIndex: -1,
    // }).fetch();
    // await Promise.all(
    //   questions.map(({ question, answer }) =>
    //     Question.create({
    //       id: uuid4(),
    //       game: id,
    //       gameId: id,
    //       question,
    //       answer,
    //     }).fetch()
    //   )
    // );

    // const gameResponse = await Game.findOne({ id })
    //   .populate("players")
    //   .populate("questions");

    // res.send(gameResponse);
    const {
      body: { rounds },
    } = req;
    console.log(req.body);

    const id = randomWords(2).join("-");

    await Game.create({
      id,
      questionIndex: -1,
    }).fetch();

    const createdRounds = await Promise.all(
      rounds.map(async (round, index) =>
        Round.create({
          id: uuid4(),
          game: id,
          gameId: id,
        }).fetch()
      )
    );

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

    const gameResponse = await Game.findOne({ id })
      .populate("players")
      .populate("rounds")
      .populate("questions");
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
