/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  /***************************************************************************
   *                                                                          *
   * Make the view located at `views/homepage.ejs` your home page.            *
   *                                                                          *
   * (Alternatively, remove this and add an `index.html` file in your         *
   * `assets` directory)                                                      *
   *                                                                          *
   ***************************************************************************/

  "GET /game/all": "GameController.findAll",
  "GET /game/:id": "GameController.find",
  "POST /game/create": "GameController.create",
  "POST /game/purge": "GameController.purge",
  "POST /game/:id/questions": "GameController.setQuestions",
  "POST /game/:id/join": "GameController.join",
  "POST /game/:id/open": "GameController.open",
  "GET /game/:id/players": "GameController.players",
  "POST /game/:id/next": "GameController.next",

  "GET /player/all": "PlayerController.findAll",
  "GET /player/:id": "PlayerController.find",
  "POST /player/create": "PlayerController.create",
  "POST /player/purge": "PlayerController.purge",

  "GET /question/all": "QuestionController.findAll",
  /***************************************************************************
   *                                                                          *
   * More custom routes here...                                               *
   * (See https://sailsjs.com/config/routes for examples.)                    *
   *                                                                          *
   * If a request to a URL doesn't match any of the routes in this file, it   *
   * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
   * not match any of those, it is matched against static assets.             *
   *                                                                          *
   ***************************************************************************/
};
