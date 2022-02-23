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

app.use(express.json());
app.use(cors())
global.players = []
global.questions = []
global.socket_io = io

require('./routes/game.route')(app)
require('./routes/player.route')(app)

http.listen(PORT, () =>
  console.log(`Express server is running on localhost:${PORT}`)
);
