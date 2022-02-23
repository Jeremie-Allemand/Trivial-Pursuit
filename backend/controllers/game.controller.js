const Game = require('../models/game.model')
exports.addPlayer = (req,res) => {
    Game.addPlayer(req.body,(err,data) =>{
        if(err)
            res.status(500).send({message:err.message} || `erreur serveur lors de l'ajout du joueur`)
        else
            res.send(data)
    })
}