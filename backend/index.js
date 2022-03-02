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
//variable et listes globales
global.players = []
global.familles = []
global.questions = []
global.socket_io = io

//Route pour les requêtes http
require('./routes/game.route')(app)
require('./routes/player.route')(app)

//Page web
app.use('/', (req,res) => {
  res.sendFile(__dirname+'/client/index.html')
})

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
        global.familles.push(item)
      }
    })
  })
}

importCSV()

http.listen(PORT, () =>
  console.log(`Express server is running on localhost:${PORT}`)
);

io.on('connection', socket =>{
  console.log(`client ${socket.id} connected`)

  //Event de réponse au question
  socket.on('ANSWER', (data) =>{
    console.log(data)
  })


  socket.on('disconnect',() => {
    console.log(`client ${socket.id} disconnected`)
  })
})