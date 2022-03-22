const Player = require('./Player')
const Game = () =>{
}

Game.addPlayer = (user,result) => {
  //Il y a déjà un utilisateur avec le même nom que celui rentré donc ça va retourner une erreur
  if(global.players.filter(p => p.username=== user.username).length > 0 || global.playing){
    result({login: "KO",message:"le Pseudo existe déjà"},null)
    return
  }
  else{
    //On ajoute un nouveau joueur dans la liste global.players
    const newPlayer = new Player(user.username)
    newPlayer.socket_id=user.socket_id
    global.players.push(newPlayer)
    result(null,{login: "OK", player: newPlayer})
    console.log(global.players)
  }
}

module.exports = Game