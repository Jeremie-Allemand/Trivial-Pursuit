const cors = require('cors')
const express = require('express');
const { createSocket } = require('dgram');
const app = express();
const http = require('http').Server(app)
const io = require('socket.io')(http,{
  cors: {
    origins: ["*"],
    methods: ["GET","POST","PUT","DELETE"]
  }
})

const PORT = process.env.PORT || 3001
var loaded = false
app.use(express.json());
app.use(cors())
global.players = []
global.familles = []
global.questions = []
global.socket_io = io

require('./routes/game.route')(app)
require('./routes/player.route')(app)


const importCSV = () => {
  const fs = require('fs')
  fs.readFile('questions.csv', 'utf-8' , (err, file) => {
    if (err) {
      console.error(err)
      return
    }
    console.log(file)
    const rows = file.toString().trim().split('\r\n')
    var splited = []
    rows.forEach((item) => {
      splited.push(item.split(';'))
    })
    splited.filter(obj => !(obj && Object.keys(obj).length === 0))
    splited.forEach((item) => {
      if(item[0].charAt(0) == '$'){
        item[0] = item[0].substring(1)
        global.questions.push(item)
      }
      if(item[0].charAt(0) == '#'){
        item[0] = item[0].substring(1)
        global.familles.push(item)
      }
    })
  })
}

importCSV()

http.listen(PORT, () =>
  console.log(`Express server is running on localhost:${PORT}`)
);
