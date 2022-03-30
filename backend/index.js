const cors = require('cors')
const express = require('express')
const { clearTimeout } = require('timers');
const app = express();
var ip = require("ip")
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
//variable et listes globales
global.playing = false
global.players = []
global.player_no = 0
global.playersWhoAnswered = 0
global.famillies = []

global.remainingQuestions 
global.questions = []
global.questions_positions = []

global.link = __dirname + "/client"
global.socket_io = io
var currentQuestion
var timerTimeout

app.use('/user', function(req,res){
  res.sendFile(global.link + '/index.html')
})
app.use('/admin', function(req,res){
  res.sendFile(global.link + '/admin.html')
})

require('./routes/game.route')(app)
importCSV()

function onGameStart(remainingQuestions){
  if(!global.playing && global.players.length > 1){
    global.remainingQuestions = remainingQuestions
    global.playing = true
    io.sockets.emit('SCORE_UPDATE',global.players)
    turnStart()
  }
}

function onFamilyAnswer(familly){
  questionSend(familly)
}

function onAnswer(answer, id){
  global.playersWhoAnswered++

  let index = global.players.findIndex(p =>p.socket_id === id)
  points = Number(currentQuestion[5])
  var multiplicator = 1

  if(index === global.player_no)
    multiplicator = 2
  if(answer === currentQuestion[1])
    global.players[index].score += points * multiplicator
  
  io.sockets.emit('SCORE_UPDATE', global.players)
  if(global.playersWhoAnswered === global.players.length)
    everyoneAnswered()
}

function onDisconnect(id){
  const index = global.players.findIndex(p =>p.socket_id === id)
  if(index)
    global.players.splice(index,1)
  console.log(`client ${id} disconnected`)
}

function turnStart(){

  global.playersWhoAnswered = 0

  if(global.playing && global.remainingQuestions > 0){
    global.player_no++
    if(global.player_no === global.players.length){
      global.player_no = 0
    }
    famillyRequest()
    global.remainingQuestions--
  }
  else if(global.remainingQuestions <= 0)
    io.sockets.emit('GAME_END')
}

function famillyRequest(){
  shuffleArray(global.famillies)
  famillies = [global.famillies[0],global.famillies[1]]
  io.sockets.emit('WAIT')
  io.to(global.players[global.player_no].socket_id).emit('FAMILLY',famillies)
}

function questionSend(familly){
  questionTimer(10)
  if(global.playing){
    currentQuestion = global.questions[familly][global.questions_positions[familly]]
    global.questions_positions[familly]++

    if(global.questions_positions[familly] === global.questions[familly].length){
      global.questions_positions[familly] = 0
      global.famillies.forEach((familly) => {
        shuffleArray(global.questions[familly[0]])
      })
    }

    io.sockets.emit('QUESTION',currentQuestion)
    // questionTimeout = setTimeout(() => showCorrectAnswer(),10 * 1000)
  }
}

function questionTimer(time){
  io.sockets.emit('TIMER',time)
  if(time > 0)
    timerTimeout = setTimeout(() => questionTimer(time-1),1000)
  else if(time === 0)
    showCorrectAnswer()
}

function everyoneAnswered(){
  clearTimeout(timerTimeout)
  showCorrectAnswer()
}

function showCorrectAnswer(){
  io.sockets.emit('CORRECT_ANSWER', currentQuestion[1])
  correctTimeout = setTimeout(() => turnStart(),5 * 1000)
}

function importCSV(){
  const fs = require('fs')
  //Lecture du fichier csv
  fs.readFile('../demo.csv', 'utf-8' , (err, file) => {
    //return s'il y a une erreur dans la lecture fichier
    if (err) {
      console.error(err)
      return
    }
    //séparation par ligne ligne
    const rows = file.toString().trim().split('\r\n')
    var splited = []
    //sépartation avec les ";"
    rows.forEach((item) => {
      splited.push(item.split(';'))
    })
    //test pour savoir si c'est une question ou une famille et ajout dans la bonne liste
    splited.forEach((item) => {
      //si c'est une famille
      if(item[0].charAt(0) == '$'){
        item[0] = item[0].substring(1)
        familly = item.shift()
        //si la famille est créer, on fait une liste pour stocker les questions de celle-ci
        if (typeof global.questions[familly] === 'undefined' || !Array.isArray(global.questions[familly])) {
          global.questions[familly] = [];
        }

        global.questions[familly].push(item)
      }
      //si c'est une question
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

io.on('connection', socket =>{
  console.log(`client ${socket.id} connected`)
  
  socket.on('GAME_START', (remainingQuestions) => onGameStart(remainingQuestions))

  socket.on('FAMILLY_ANSWER',(data) => onFamilyAnswer(data))

  socket.on('ANSWER', (answer) => onAnswer(answer, socket.id))

  socket.on('disconnect',() => onDisconnect(socket.id))
})

http.listen(PORT, () => {
  console.log(`Express server is running on localhost:${PORT}`)
});