const cors = require('cors')
const express = require('express')
const { createSocket } = require('dgram')
const app = express();
const http = require('http').Server(app)
const io = require('socket.io')(http,{
  cors: {
    origins: ["*"],
    methods: ["GET","POST","PUT","DELETE"]
  }
})
const timer = ms => new Promise( res => setTimeout(res, ms));
const PORT = process.env.PORT || 3001
app.use(express.json());
app.use(cors())
//variable et listes globales
global.playing = true
global.players = []
global.famillies = []
global.questions = []
global.player_no = 0
global.question_no = 0
global.link = __dirname + "/client"
global.socket_io = io

//Route pour les requêtes http
require('./routes/game.route')(app)
require('./routes/player.route')(app)

///Fonction pour importer les CSV
const importCSV = () => {
  const fs = require('fs')
  //Lecture du fichier csv
  fs.readFile('questions.csv', 'utf-8' , (err, file) => {
    //return s'il y a une erreur
    if (err) {
      console.error(err)
      return
    }
    //séparation par line ligne
    const rows = file.toString().trim().split('\r\n')
    var splited = []
    //sépartation avec les ";"
    rows.forEach((item) => {
      splited.push(item.split(';'))
    })
    //filtre pour retirer les object vides
    splited.filter(obj => !(obj && Object.keys(obj).length === 0))
    //test pour savoir si c'est une question ou une famille et ajout dans la bonne liste
    splited.forEach((item) => {
      if(item[0].charAt(0) == '$'){
        item[0] = item[0].substring(1)
        global.questions.push(item)
      }
      if(item[0].charAt(0) == '#'){
        item[0] = item[0].substring(1)
        global.famillies.push(item)
      }
    })
  })
}

importCSV()

function shuffleArray(arr) {
    arr.sort(() => Math.random() - 0.5);
}

function famillyRequest(){
  shuffleArray(global.famillies)
  data = [global.famillies[0],global.famillies[1]]
  io.to(global.players[global.player_no].socket_id).emit('FAMILLY',data)
  timer(10000).then(_=>questionSend());
}

function questionSend(){
  if(global.playing){
    io.sockets.emit('QUESTION',global.questions[global.question_no]) //envoie de la question
    // console.log("Question : " + global.question_no)
    timer(10000).then(_=>famillyRequest());
  }
}


http.listen(PORT, () =>
  console.log(`Express server is running on localhost:${PORT}`)
);

io.on('connection', socket =>{
  console.log(`client ${socket.id} connected`)

  socket.on('GAMESTART', (data) =>{
    console.log(data)
    famillyRequest()
  })

  //Event de réponse au question
  socket.on('ANSWER', (data) =>{
    const index = global.players.findIndex(p =>p.socket_id === socket.id)
    points = Number(global.questions[global.question_no][6])
    global.players[index].score += points
    console.log(global.players)
  })

  socket.on('disconnect',() => {
    console.log(`client ${socket.id} disconnected`)
  })
})