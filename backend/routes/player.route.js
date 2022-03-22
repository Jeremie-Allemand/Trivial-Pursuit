module.exports = (app) => {
    const playerctrl = require('../controllers/player.controller')
    app.use('/user',playerctrl.mainPage)
    app.use('/admin',playerctrl.adminPage)
}