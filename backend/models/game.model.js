const Player = require('./Player')
const Game = () =>{
}

Game.addPlayer = (user,result) => {
    if(global.players.filter(p => p.username=== user.username).length > 0){
    result({login: "KO",message:"le Pseudo existe déjà"},null)
    return
  }
  else{
    const newPlayer = new Player(user.username)
    newPlayer.socket_id=user.socket_id
    global.players.push(newPlayer)
    result(null,{login: "OK", player: newPlayer})
    console.log(global.players)
  }
}

module.exports = Game