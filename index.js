var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(5000, function() {
  console.log('Starting server on port 5000');
});

setInterval(function() {
  io.sockets.emit('message', 'server is still running');
}, 1000);

//dictionary of new players
var players = {};
var playerSpd = 3;

//register a new players when they connect
io.on('connection', function(socket) {
  socket.on('new player', function() {
    players[socket.id] = {
      x: 300,
      y: 300
    };
  });
  
  //update new layer positions
  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
    if (data[LEFT_ARROW]) {
      player.x -= playerSpd;
    }
    if (data[UP_ARROW]) {
      player.y -= playerSpd; 
	  }
    if (data[RIGHT_ARROW]) {
      player.x += playerSpd;
    }
    if (data[DOWN_ARROW]) {
      player.y += playerSpd 
    }
  });
  
});

//broadcast updated player state to all players
setInterval(function() {
  io.sockets.emit('state', players);
}, 1000 / 60);