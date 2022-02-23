module.exports = (app) => {
    const gamectrl = require('../controllers/game.controller')
    app.post('/addplayer',gamectrl.addPlayer)
}