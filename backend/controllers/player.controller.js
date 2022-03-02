// const Player = require('../models/player.model')
exports.mainPage = (req,res) => {
    //Methode pour mettre en place le site pour le client
    res.sendFile(global.link + '/index.html')
}