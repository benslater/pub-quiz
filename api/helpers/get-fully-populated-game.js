module.exports = {
  friendlyName: "Get fully populated game",

  description:
    "Get an instance of a game, populating all the Players, Rounds, Questions, and PlayerAnswers",

  inputs: {
    gameId: {
      type: "string",
      example: "fun-game",
      description: "The ID of the game to retrieve",
      required: true,
    },
  },

  exits: {
    success: {
      outputFriendlyName: "Fully populated game",
    },
    notFound: {
      description: "No user with the specified ID was found in the database.",
    },
  },

  fn: async ({ gameId }, exits) => {
    // Get fully populated game.
    const game = await Game.findOne({ gameId });
    if (!game) {
      // TODO: This is a 500, needs to be 404
      throw "notFound";
    }

    game.players = await Player.find({ game: game.id }).populate("answers");
    game.rounds = await Round.find({ game: game.id }).populate("questions");
    game.rounds = await Promise.all(
      game.rounds.map(async (round) => ({
        ...round,
        questions: await Promise.all(
          round.questions.map(async (question) => ({
            ...question,
            playerAnswers: await PlayerAnswer.find({ question: question.id }),
          }))
        ),
      }))
    );

    // Send back the result through the success exit.
    exits.success(game);
  },
};
