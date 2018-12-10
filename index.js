//dependencies
var express = require('express');
var path = require('path');
var http = require('http');
var socketIO = require('socket.io');
console.log("dependencies loaded");

var app = express();
var server = http.Server(app);
var io = socketIO(server);
var portnum = process.env.PORT || 1337;
console.log("packages created");

app.set('port', portnum);
app.use('/static', express.static(__dirname + '/static'));
console.log("app directory static found");

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});
console.log("routing file completed");

// Starts the server.
server.listen(portnum , function() {
  console.log('Starting server on port%d', portnum);
});


var math = {
    upper: function(value, limit) { 
        if(value > limit) {
            return limit;      
        }
        else {
        return value;
        }
    },

    lower: function(value, limit) {
        if (value < limit) {
            return limit;
        }
        else {
            return value;
        }
    },

    between: function (value, lowlimit, upplimit) {
        value = this.upper(value, upplimit);
        value = this.lower(value, lowlimit);
        return value;
    },

    randInt: function (low, high) {return Math.round(low+Math.random()*   (high-low),0);},
    toRad: function (angle) {return angle*Math.PI/180;}
};

var direction = function (from, x,y){
	dy = y - from.y;
	dx = x - from.x;
	var angle = 0;
	if(dx !== 0)
	{
	     angle = Math.atan(dy/dx)*180/Math.PI;
	}
	if (dx < 0)
		angle = 180 + angle;
	return angle;
};

var inBounds = function(object, xmin, xmax, ymin, ymax){
    var inside = false;
    if(object.x >= xmin && object.x <=xmax)
    {
        if(object.y >= ymin && object.y <= ymax)
        {
            inside = true;
        }
    }
    return inside;
};

var motion = {
        angle: 0,
	freq: 0,
	set: function(object, angle, speed)
	{
	  	object.x += speed *Math.cos(angle*Math.PI/180);
		object.y -= speed *Math.sin(angle*Math.PI/180);
	},

	follow: function(follower, x,y, speed) {
		var angle = -1*direction(follower, x, y);
		if (!inBounds(follower, x-1,x+1,y-1,y+1))
			this.set(follower,angle,speed);
	},
	
	away: function(awayer, x,y,speed)
	{
		var angle = -1*direction(awayer, x, y) - 180;
		this.set(awayer,angle,speed);
	},

	circular: function(object, speed, ang)
	{	this.angle += ang;
		if (this.angle >= 360) this.angle = 0;
		this.set(object, this.angle, speed);
	},

	bop: function(object, amp, freq)
	{		
		this.freq += freq;
		if (this.freq >=360) this.freq = 0;
		object.y += amp*Math.sin(this.freq* Math.PI/180);
	},
        
        move: function(object,damping)
        {
            var isMoving = false;
            object.x += object.velocity.x;
    		object.y -= object.velocity.y;
    		object.velocity.x *= damping;
    		object.velocity.y *= damping;
            if (Math.abs(object.velocity.x) < 0.01 && Math.abs(object.velocity.y) < 0.01)
                        isMoving = false;
                else
                        isMoving = true;
                        
                return isMoving;
        }
        
};


var projectile = function() {
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.velocity = 3;
    this.size = 5;
    this.update = function() {
        this.x += this.velocity*Math.cos(this.angle*Math.PI/180);
        this.y += this.velocity*Math.sin(this.angle*Math.PI/180);
    };
};

var projectiles = [];

var mouse = {};

setInterval(function() {
  io.sockets.emit('message', 'server is still running');
}, 1000);

//dictionary of new players
var players = {};
var playerSpd = 3;

//register a new players when they connect
io.on('connection', function(socket) {
  socket.on('new player', function() {
	  var posx = math.randInt(0,320);
	  var posy = math.randInt(0,480);
	  var r=math.randInt(20,255);
	  var g=math.randInt(20,255);
	  var b=math.randInt(20,255);
    players[socket.id] = {
      x: posx,
      y: posy,
	  r: r,
	  g: g,
	  b: b
    };
  });
  
  //update new layer positions
socket.on('keys', function(data) {
	
    var player = players[socket.id] || {};
	
	//handles keyboard
		if (data[37]) {
		  player.x -= playerSpd;
		}
		
		if (data[38]) {
		  player.y -= playerSpd; 
		}
		  
		if (data[39]) {
		  player.x += playerSpd;
		}
	
		if (data[40]) {
			player.y += playerSpd 
		}


});

socket.on('mouse', function(data) {
	
    var player = players[socket.id] || {};
	mouse = data;
	
	if(data.isPressed && player.x != data.x && player.y != data.y && !data.isSwiped)
	{
		motion.follow(player,data.x, data.y, playerSpd);	
	}
	else
	{
		data.isPressed = false;
	}
	
	if(data.isSwiped)
	{	
		p = new projectile();
		p.x = player.x;
		p.y = player.y;
		p.angle = -1*direction(player, data.x, data.y);	
		projectiles[projectiles.length] = p ;
		//console.log(p.angle);
	}		
});

});

//update and broadcast state to all players
setInterval(function() {	
	for(var i = 0; i < projectiles.length; i++) {
		
		motion.set(projectiles[i], projectiles[i].angle, 5);
		//projectilei[i].x += 1;
	}	
	
  io.sockets.emit('projectiles', projectiles);
   io.sockets.emit('state', players);
}, 1000 / 60);


