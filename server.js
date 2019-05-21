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
  log('A website connected to the server');

  socket.on('disconnect',function(socket){
    log('A website disconnected from the server');
  });

// Join room command.
// Input: room, username.
// Success Output: result, room, username, membership total.
// Failure Output: result, message
  socket.on('join_room',function(payload){
    log('Server received a command', 'join_room', payload);
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
    if('undefined' == typeof username || !username){
      var errorMessage = 'join_room did not specify a username, command aborted';
      log(errorMessage);
      socket.emit('join_room_response',{
        result: 'fail',
        message: errorMessage
        });
        return;
    }

    socket.join(room);

    var roomObject = io.sockets.adapter.rooms[room];
    if('undefined' == typeof roomObject || !roomObject){
      var errorMessage = 'join_room could not create a room (internal error), command aborted';
      log(errorMessage);
      socket.emit('join_room_response',{
        result: 'fail',
        message: errorMessage
        });
        return;
    }

    var numClients = roomObject.length;
    var successData = {
      result: 'success',
      room: room,
      username: username,
      membership: (numClients + 1)
    };
    io.sockets.in(room).emit('join_room_response', successData);
    log('\tRoom: ' + room + '\n\tJoined by: ' + username);

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
