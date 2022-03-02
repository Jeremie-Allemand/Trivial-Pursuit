module.exports = (app) => {
    const playerctrl = require('../controllers/player.controller')
    app.use('/',playerctrl.mainPage)
}