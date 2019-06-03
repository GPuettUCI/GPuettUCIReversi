//////////////
// Requires //
//////////////

// Static file webserver library
// http server library
var static = require('node-static');
var http = require('http');

// For Heroku
var port = process.env.PORT;
var directory = __dirname + '/public';
// Readjust port and dir info for local
if (typeof port == "undefined" || !port) {
  directory = './public';
  port = 8080;
}

// Static web server to deliver files
var file = new static.Server(directory);

// http server that retrieves files from file Server
var app = http.createServer(
  function(request, response) {
    request.addListener('end',
      function() {
        file.serve(request, response);
      }
    ).resume();
  }
).listen(port);

console.log("Running on port: " + port);


/////////////////////
// Player registry //
/////////////////////
var players = [];

///////////////////////
// Web Socket Server //
///////////////////////
// Set up
var io = require('socket.io').listen(app);


//////////////////////////
// Socket communication //
//////////////////////////
io.sockets.on('connection', function(socket) {

  //////////////////
  // Log Function //
  //////////////////
  function log() {
    var array = ['*** Sever Log Message: '];
    for (var i = 0; i < arguments.length; i++) {
      array.push(arguments[i]);
      console.log(arguments[i]);
    }
    socket.emit('log', array);
    socket.broadcast.emit('log', array);
  }


  log('Client connection by: ' + socket.id);

  ///////////////
  // Join Room //
  ///////////////
  // Input: room, username.
  // Success Output: result, room, username, socket id, membership total.
  // Failure Output: result, message
  socket.on('join_room', function(payload) {
    log('Join Room command: ' + JSON.stringify(payload));

    //Check if client has a payload
    if ('undefined' == typeof payload || !payload) {
      var errorMessage = 'join_room had no payload, command aborted';
      log(errorMessage);
      socket.emit('join_room_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var room = payload.room;
    //Check that payload has a room
    if ('undefined' == typeof room || !room) {
      var errorMessage = 'join_room did not specify a room, command aborted';
      log(errorMessage);
      socket.emit('join_room_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var username = payload.username;
    //Check that username has been provided
    if ('undefined' == typeof username || !username) {
      var errorMessage = 'join_room did not specify a username, command aborted';
      log(errorMessage);
      socket.emit('join_room_response', {
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
    for (var socketInRoom in roomObject.sockets) {
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


    if(room !== 'lobby'){
      sendGameUpdate(socket, room, 'initial update')
    }

  });

  ////////////////
  // Disconnect //
  ////////////////
  // Input: N/A
  // Success Output: username, socket id.
  // Failure Output: N/A
  socket.on('disconnect', function() {
    log('Client disconnected: ' + JSON.stringify(players[socket.id]));
    if (typeof players[socket.id] != 'undefined' && players[socket.id]) {
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



  //////////////////
  // Send Message //
  //////////////////
  // Input: room, message.
  // Success Output: result, username, message.
  // Failure Output: result, message.
  socket.on('send_message', function(payload) {
    log('Server received a command', 'send_message', payload);
    if ('undefined' == typeof payload || !payload) {
      var errorMessage = 'send_message had no payload, command aborted';
      log(errorMessage);
      socket.emit('send_message_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var room = payload.room;
    if ('undefined' == typeof room || !room) {
      var errorMessage = 'send_message did not specify a room, command aborted';
      log(errorMessage);
      socket.emit('send_message_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var username = players[socket.id].username;
    if ('undefined' == typeof username || !username) {
      var errorMessage = 'send_message did not specify a username, command aborted';
      log(errorMessage);
      socket.emit('send_message_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var message = payload.message;
    if ('undefined' == typeof message || !message) {
      var errorMessage = 'send_message did not specify a username, command aborted';
      log(errorMessage);
      socket.emit('send_message_response', {
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
    io.in(room).emit('send_message_response', successData);
    log('Message sent to ' + room + ' by ' + username);
  });


  ////////////
  // Invite //
  ////////////
  // Input: requested user.
  // Success Output invite: result, socket id of requested user.
  // Success Output invited: result, socket id of requested user.
  // Failure Output: result, message.
  socket.on('invite', function(payload) {
    log('invite with ', JSON.stringify(payload));
    if ('undefined' == typeof payload || !payload) {
      var errorMessage = 'invite had no payload, command aborted';
      log(errorMessage);
      socket.emit('invite_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var username = players[socket.id].username;
    if (typeof username == 'undefined' || !username) {
      var errorMessage = 'invite did not specify a username, command aborted';
      log(errorMessage);
      socket.emit('invite_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }


    var requested_user = payload.requested_user;
    if (typeof requested_user == 'undefined' || !requested_user) {
      var errorMessage = 'invite did not specify a requested user, command aborted';
      log(errorMessage);
      socket.emit('invite_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var room = players[socket.id].room;
    var roomObj = io.sockets.adapter.rooms[room];

    // Ensure user that is being invited is in the room
    if (!roomObj.sockets.hasOwnProperty(requested_user)) {
      var errorMessage = 'invite requested a user that is not in the room, command aborted';
      log(errorMessage);
      socket.emit('invite_response', {
        result: 'fail',
        message: errorMessage
      });
    }

    // if everything is ok, respond with success

    var successData = {
      result: 'success',
      socket_id: requested_user
    };
    socket.emit('invite_response', successData);

    var successData2 = {
      result: 'success',
      socket_id: socket.id
    };
    socket.to(requested_user).emit('invited', successData2);

    log('Invite successful')

  });


  //////////////
  // Uninvite //
  //////////////
  // Input: requested user.
  // Success Output invite: result, socket id of the uninvited.
  // Success Output invited: result, socket id of uninviter.
  // Failure Output: result, message.
  socket.on('uninvite', function(payload) {
    log('uninvite with ', JSON.stringify(payload));
    if ('undefined' == typeof payload || !payload) {
      var errorMessage = 'uninvite had no payload, command aborted';
      log(errorMessage);
      socket.emit('uninvite_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var username = players[socket.id].username;
    if (typeof username == 'undefined' || !username) {
      var errorMessage = 'uninvite did not specify a username, command aborted';
      log(errorMessage);
      socket.emit('uninvite_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }


    var requested_user = payload.requested_user;
    if (typeof requested_user == 'undefined' || !requested_user) {
      var errorMessage = 'uninvite did not specify a requested user, command aborted';
      log(errorMessage);
      socket.emit('uninvite_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var room = players[socket.id].room;
    var roomObj = io.sockets.adapter.rooms[room];

    // Ensure user that is being uninvited is in the room
    if (!roomObj.sockets.hasOwnProperty(requested_user)) {
      var errorMessage = 'uninvite requested a user that is not in the room, command aborted';
      log(errorMessage);
      socket.emit('uninvite_response', {
        result: 'fail',
        message: errorMessage
      });
    }

    // if everything is ok, respond with success
    var successData = {
      result: 'success',
      socket_id: requested_user
    };
    socket.emit('uninvite_response', successData);

    var successData2 = {
      result: 'success',
      socket_id: socket.id
    };
    socket.to(requested_user).emit('uninvited', successData2);

    log('unInnvite successful')

  });

  ////////////////
  // Game Start //
  ////////////////
  // Input: requested user.
  // Success Output invite: result, socket id of other player, game_id.
  // Failure Output: result, message.
  socket.on('game_start', function(payload) {
    log('game start with ', JSON.stringify(payload));
    if ('undefined' == typeof payload || !payload) {
      var errorMessage = 'uninvite had no payload, command aborted';
      log(errorMessage);
      socket.emit('game_start_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var username = players[socket.id].username;
    if (typeof username == 'undefined' || !username) {
      var errorMessage = 'gameStart did not specify a username, command aborted';
      log(errorMessage);
      socket.emit('game_start_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }


    var requested_user = payload.requested_user;
    if (typeof requested_user == 'undefined' || !requested_user) {
      var errorMessage = 'gameStart did not specify a requested user, command aborted';
      log(errorMessage);
      socket.emit('game_start_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var room = players[socket.id].room;
    var roomObj = io.sockets.adapter.rooms[room];

    // Ensure user that is being uninvited is in the room
    if (!roomObj.sockets.hasOwnProperty(requested_user)) {
      var errorMessage = 'gameStart requested a user that is not in the room, command aborted';
      log(errorMessage);
      socket.emit('gameStart_response', {
        result: 'fail',
        message: errorMessage
      });
    }

    // if everything is ok, respond with success
    var game_id = Math.floor((1+Math.random()) * 0x10000).toString(16).substring(1);
    var successData = {
      result: 'success',
      socket_id: requested_user,
      game_id: game_id
    };
    socket.emit('game_start_response', successData);

    //Tell other player to play
    var successData2 = {
      result: 'success',
      socket_id: socket.id,
      game_id: game_id
    };
    socket.to(requested_user).emit('game_start_response', successData2);

    log('gameStart successful')

  });








  //Close tags for socket
});


/////////////////////
// Game State Code //
/////////////////////
var games = [];


//////////////////////////////
// Create new Game Function //
//////////////////////////////
function createNewGame(){
  var newGame = {};
  newGame.playerWhite = {};
  newGame.playerBlack = {};
  newGame.playerWhite.socket = '';
  newGame.playerWhite.username = '';
  newGame.playerBlack.socket = '';
  newGame.playerBlack.username = '';

  var date = new Date();
  newGame.lastMoveTime = date.getTime();

  newGame.currentTurn = 'white';

  newGame.board = [
    [' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ','w','b',' ',' ',' '],
    [' ',' ',' ','b','w',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' ']
  ];

  return newGame;
}//end createNewGame()

///////////////////////////////
// Send Game Update function //
///////////////////////////////
function sendGameUpdate(socket, game_id, message){
    // Check to see if game exists
    if(typeof games[game_id] == 'undefined' || !games[game_id]){
      console.log('No game exists. Creating. \n' + game_id + ' for ' + socket.id);
      games[game_id] = createNewGame();
    }

    // Make sure only 2 Players

    // Assign socket a color

    // Send game Update
    var successData = {
      result: 'success',
      game: games[game_id],
      message: message,
      game_id: game_id
    };
    io.in(game_id).emit('game_update', successData);

    // Check to see if game is over
}// end sendGameUpdate()
