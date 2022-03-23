const cors = require('cors')
const express = require('express')
const { createSocket } = require('dgram');
const { clearTimeout } = require('timers');
const app = express();
const http = require('http').Server(app)
const io = require('socket.io')(http,{
  cors: {
    origins: ["*"],
    methods: ["GET","POST","PUT","DELETE"]
  }
})
const timer = (ms) => new Promise( res => setTimeout(res, ms));

const PORT = process.env.PORT || 3001
app.use(express.json());
app.use(cors())
//variable et listes globales
global.playing = false
global.players = []
global.player_no = 0
global.playersWhoAnswered = 0
global.famillies = []

global.questions_restantes 
global.questions = []
global.questions_positions = []

global.link = __dirname + "/client"
global.socket_io = io
var currentQuestion
var questionTimeout
var secondTimeout

require('./routes/game.route')(app)
require('./routes/player.route')(app)
importCSV()

function importCSV(){
  const fs = require('fs')
  //Lecture du fichier csv
  fs.readFile('../questions.csv', 'utf-8' , (err, file) => {
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
        familly = item.shift()

        if (typeof global.questions[familly] === 'undefined' || !Array.isArray(global.questions[familly])) {
          global.questions[familly] = [];
        }

        global.questions[familly].push(item)
      }

      if(item[0].charAt(0) == '#'){
        item[0] = item[0].substring(1)
        item = item.slice(0,2)
        global.famillies.push(item)
        global.questions_positions[item[0]] = 0
      }
    })

    global.famillies.forEach((familly) => {
      shuffleArray(global.questions[familly[0]])
    })

  })
}

function shuffleArray(arr) {
    arr.sort(() => Math.random() - 0.5);
}

function famillyRequest(){

  global.playersWhoAnswered = 0

  if(global.playing && global.questions_restantes > 0){
    global.player_no++
    global.questions_restantes--
    if(global.player_no === global.players.length)
      global.player_no = 0
    
    shuffleArray(global.famillies)
    data = [global.famillies[0],global.famillies[1]]
    io.sockets.emit('WAIT')
    io.to(global.players[global.player_no].socket_id).emit('FAMILLY',data)
  }
  else if(global.questions_restantes <= 0)
    io.sockets.emit('GAME_END')
}

function questionSend(familly){
  questionTimer(10)
  if(global.playing){
    currentQuestion = global.questions[familly][global.questions_positions[familly]]
    global.questions_positions[familly]++
    if(global.questions_positions[familly] === global.questions[familly].length)
      global.questions_positions[familly] = 0
    io.sockets.emit('QUESTION',currentQuestion) //envoie de la question
    questionTimeout = setTimeout(() => showCorrectAnswer(),10 * 1000)
  }
}

function everyoneAnswered(){
  clearTimeout(questionTimeout)
  clearTimeout(secondTimeout)
  showCorrectAnswer()
}

function questionTimer(time){
  io.sockets.emit('TIMER',time)
  if(time > 0)
    secondTimeout = setTimeout(() => questionTimer(time-1),1000)
}

function showCorrectAnswer(){
  io.sockets.emit('CORRECT_ANSWER')
  correctTimeout = setTimeout(() => famillyRequest(),5 * 1000)
}

http.listen(PORT, () =>
  console.log(`Express server is running on localhost:${PORT}`)
);

io.on('connection', socket =>{
  console.log(`client ${socket.id} connected`)

  socket.on('GAME_START', (questions_restantes) =>{
    if(!global.playing){
      global.questions_restantes = questions_restantes
      global.playing = true
      io.sockets.emit('SCORE_UPDATE',global.players)
      famillyRequest()
    }
  })

  socket.on('FAMILLY_ANSWER',(data) =>{
    questionSend(data)
  })

  socket.on('ANSWER', (data) =>{
    global.playersWhoAnswered++

    let index = global.players.findIndex(p =>p.socket_id === socket.id)
    points = Number(currentQuestion[5])
    var multiplicator = 1

    if(index === global.player_no)
      multiplicator = 2
    if(data === currentQuestion[1])
      global.players[index].score += points * multiplicator
    
    io.sockets.emit('SCORE_UPDATE', global.players)
    if(global.playersWhoAnswered === global.players.length)
      everyoneAnswered()
  })

  socket.on('disconnect',() => {
    let index = global.players.findIndex(p =>p.socket_id === socket.id)
    global.players.splice(index,1)
    console.log(`client ${socket.id} disconnected`)
  })
})