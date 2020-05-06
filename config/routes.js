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

  "POST /api/game/create": "GameController.create",
  "GET /api/game/:id/join": "GameController.join",
  "POST /api/game/:id/next": "GameController.next",
  "POST /api/game/:id/answer": "GameController.answer",
  "POST /api/game/:id/answer/:answerId/mark": "GameController.mark",

  "POST /api/player/create": "PlayerController.create",

  "GET /api/question/all": "QuestionController.findAll",
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

  "GET /api/get-csrf": { action: "security/grant-csrf-token" },

  "GET *": "/",
};
