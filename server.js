// Static file webserver library
var static = require('node-static');

// http server library
var http = require('http');

// Assume running on Heroku
var port = process.env.PORT;
var directory = __dirname + '/public';

// If not on heroku, readjust port and dir info
if(typeof port == "undefined" || !port)
{
  directory = './public';
  port = 8080;
}

// Static web server to deliver files
var file = new static.Server(directory);

// http server that retrieves files from file Server
var app = http.createServer(
            function(request,response){
              request.addListener('end',
                function(){
                  file.serve(request,response);
                }
              ).resume();
            }
          ).listen(port);

console.log("Running on port: " + port);


// Set up the web socket Server

//Registry of socket id's and player info
var players = [];


var io = require('socket.io').listen(app);
io.sockets.on('connection', function(socket) {

  function log(){
    var array = ['*** Sever Log Message: '];
    for(var i=0; i<arguments.length; i++)
    {
      array.push(arguments[i]);
      console.log(arguments[i]);
    }
    socket.emit('log', array);
    socket.broadcast.emit('log', array);
  }
  log('Client connection by: ' + socket.id);

// Join room command.
// Input: room, username.
// Success Output: result, room, username, socket id, membership total.
// Failure Output: result, message
  socket.on('join_room',function(payload){
    log('Join Room command: ' + JSON.stringify(payload));

    //Check if client has a payload
    if('undefined' == typeof payload || !payload){
      var errorMessage = 'join_room had no payload, command aborted';
      log(errorMessage);
      socket.emit('join_room_response',{
        result: 'fail',
        message: errorMessage
        });
        return;
    }

    var room = payload.room;
    //Check that payload has a room
    if('undefined' == typeof room || !room){
      var errorMessage = 'join_room did not specify a room, command aborted';
      log(errorMessage);
      socket.emit('join_room_response',{
        result: 'fail',
        message: errorMessage
        });
        return;
    }

    var username = payload.username;
    //Check that username has been provided
    if('undefined' == typeof username || !username){
      var errorMessage = 'join_room did not specify a username, command aborted';
      log(errorMessage);
      socket.emit('join_room_response',{
        result: 'fail',
        message: errorMessage
        });
        return;
    }

    //Store info for new player
    players[socket.id] = {};
    players[socket.id].username = username;
    players[socket.id].room = room;


    //Join room
    socket.join(room);

    //Get room object
    var roomObject = io.sockets.adapter.rooms[room];

    // Tell all current users that someone just joined
    var numClients = roomObject.length;
    var successData = {
      result: 'success',
      room: room,
      username: username,
      socket_id: socket.id,
      membership: numClients
    };
    log(successData);
    //tell room that someone just joined
    io.in(room).emit('join_room_response', successData);

    // tell new joiner who is in room
    for(var socketInRoom in roomObject.sockets){
      var successData = {
        result: 'success',
        room: room,
        username: players[socketInRoom].username,
        socket_id: socketInRoom,
        membership: numClients
      };
      socket.emit('join_room_response', successData);
    }

    log('Join room success');

  });

//Disconnect command
  socket.on('disconnect', function(){
    log('Client disconnected: ' + JSON.stringify(players[socket.id]));
    if(typeof players[socket.id] !== 'undefined' && players[socket.id])
    {
      var username = players[socket.id].username;
      var room = players[socket.id].room;
      var payload = {
        username: username,
        socket_id: socket.id
      };
      delete players[socket.id];
      io.in(room).emit('player_disonnected', payload);
    }
  });

  // Send Message command.
  // Input: room, username, message.
  // Success Output: result, username, message.
  // Failure Output: result, message.
  socket.on('send_message',function(payload){
    log('Server received a command', 'send_message', payload);
    if('undefined' == typeof payload || !payload){
      var errorMessage = 'send_message had no payload, command aborted';
      log(errorMessage);
      socket.emit('send_message_response',{
        result: 'fail',
        message: errorMessage
        });
        return;
    }

    var room = payload.room;
    if('undefined' == typeof room || !room){
      var errorMessage = 'send_message did not specify a room, command aborted';
      log(errorMessage);
      socket.emit('send_message_response',{
        result: 'fail',
        message: errorMessage
        });
        return;
    }

    var username = payload.username;
    if('undefined' == typeof username || !username){
      var errorMessage = 'send_message did not specify a username, command aborted';
      log(errorMessage);
      socket.emit('send_message_response',{
        result: 'fail',
        message: errorMessage
        });
        return;
    }

    var message = payload.message;
    if('undefined' == typeof message || !message){
      var errorMessage = 'send_message did not specify a username, command aborted';
      log(errorMessage);
      socket.emit('send_message_response',{
        result: 'fail',
        message: errorMessage
        });
        return;
    }

    var successData = {
      result: 'success',
      room: room,
      username: username,
      message: message
    };
    io.sockets.in(room).emit('send_message_response', successData);
    log('Message sent to ' + room + ' by ' + username);
  });

//Close tags
});
