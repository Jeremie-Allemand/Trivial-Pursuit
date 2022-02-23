const {v4:uuidv4} = require('uuid')

function Player(username){
    this.uuid=uuidv4()
    this.socket_id=""
    this.username=username
    this.score = 0
}

module.exports = Player