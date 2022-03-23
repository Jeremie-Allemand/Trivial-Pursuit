const Player = require('./Player')
const Game = () =>{

}

Game.addPlayer = (user,result) => {
  //Il y a déjà un utilisateur avec le même nom que celui rentré donc ça va retourner une erreur
  if(global.players.filter(p => p.username=== user.username).length > 0){
    result({login: "KO",message:"Le Pseudo existe déjà"},null)
    return
  }
  if(global.playing){
    result({login: "KO", message:"La partie est déja en cours"})
    return
  }
  else{
    //On ajoute un nouveau joueur dans la liste global.players
    const newPlayer = new Player(user.username)
    newPlayer.socket_id=user.socket_id
    global.players.push(newPlayer)
    result(null,{login: "OK", player: newPlayer})
    global.socket_io.sockets.emit('LOGIN', global.players)
    console.log(global.players)
  }
}

module.exports = Game