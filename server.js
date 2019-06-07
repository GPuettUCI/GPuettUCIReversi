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


    if (room !== 'lobby') {
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
    var game_id = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
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

  }); // Game Start Close tags

  ////////////////
  // Play Token //
  ////////////////
  // Input: row, column, color.
  // Success Output invite: result.
  // Failure Output: result, message.
  socket.on('play_token', function(payload) {
    log('game start with ', JSON.stringify(payload));
    if ('undefined' == typeof payload || !payload) {
      var errorMessage = 'play_token had no payload, command aborted';
      log(errorMessage);
      socket.emit('play_token_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    // Check for registered player.
    var player = players[socket.id];
    if (typeof player == 'undefined' || !player) {
      var errorMessage = 'Sever does not recognize user, retry';
      log(errorMessage);
      socket.emit('play_token_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var username = players[socket.id].username;
    if (typeof username == 'undefined' || !username) {
      var errorMessage = 'play_token did not specify a username, command aborted';
      log(errorMessage);
      socket.emit('play_token_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var gameID = players[socket.id].room;
    if (typeof gameID == 'undefined' || !gameID) {
      var errorMessage = 'play token unable to find game board';
      log(errorMessage);
      socket.emit('play_token_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var row = payload.row;
    if (typeof row == 'undefined' || row < 0 || row > 7) {
      var errorMessage = 'play token did not specity a valid row, command aborted';
      log(errorMessage);
      socket.emit('play_token_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var col = payload.column;
    if (typeof col == 'undefined' || col < 0 || col > 7) {
      var errorMessage = 'play token did not specity a valid column, command aborted';
      log(errorMessage);
      socket.emit('play_token_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var color = payload.color;
    if (typeof color == 'undefined' || !color || (color != 'white' && color != 'black')) {
      var errorMessage = 'play token did not specity a valid color, command aborted';
      log(errorMessage);
      socket.emit('play_token_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var game = games[gameID];
    if (typeof game == 'undefined' || !game) {
      var errorMessage = 'play token could not find your game, command aborted';
      log(errorMessage);
      socket.emit('play_token_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    if (color !== game.currentTurn) {
      var errorMessage = 'play_token played out of turn.';
      log(errorMessage);
      socket.emit('play_token_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }
    if ((game.currentTurn === 'white' && game.playerWhite.socket !== socket.id) ||
      (game.currentTurn === 'white' && game.playerWhite.socket !== socket.id)) {
      var errorMessage = 'play_token played out of turn.';
      log(errorMessage);
      socket.emit('play_toekn_response', {
        result: 'fail',
        message: errorMessage
      });
      return;
    }

    var successData = {
      result: 'success'
    };
    socket.emit('play_token_response', successData);

    //Execute the move
    if (color == 'white') {
      game.board[row][col] = 'w';
      game.currentTurn = 'black';
    } else if (color == 'black') {
      game.board[row][col] = 'b';
      game.currentTurn = 'white';
    }

    var date = new Date();
    game.lastMoveTime = date.getTime();

    sendGameUpdate(socket, gameID, 'played a token');

  }); // Play token close tags


}); //Close tags for socket


/////////////////////
// Game State Code //
/////////////////////
var games = [];


//////////////////////////////
// Create new Game Function //
//////////////////////////////
function createNewGame() {
  var date = new Date();

  var newGame = {};
  newGame.playerWhite = {};
  newGame.playerBlack = {};
  newGame.playerWhite.socket = '';
  newGame.playerWhite.username = '';
  newGame.playerBlack.socket = '';
  newGame.playerBlack.username = '';
  newGame.lastMoveTime = date.getTime();
  newGame.currentTurn = 'black';

  newGame.board = [
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', 'w', 'b', ' ', ' ', ' '],
    [' ', ' ', ' ', 'b', 'w', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
  ];

  return newGame;
} //end createNewGame()

///////////////////////////////
// Send Game Update function //
///////////////////////////////
function sendGameUpdate(socket, game_id, message) {
  // Check to see if game exists
  if (typeof games[game_id] == 'undefined' || !games[game_id]) {
    console.log('No game exists. Creating. \n' + game_id + ' for ' + socket.id);
    games[game_id] = createNewGame();
  }

  // Make sure only 2 Players
  var roomObj;
  var numClients;
  do {
    roomObj = io.sockets.adapter.rooms[game_id];
    numClients = roomObj.length;
    if (numClients > 2) {
      console.log('Too many clients in room: ' + '#' + numClients + '\tgame:' + game_id);
      if (games[game_id].playerWhite.socket == roomObj.sockets[0]) {
        games[game_id].playerWhite.socket = '';
        games[game_id].playerWhite.username = '';
      }
      if (games[game_id].playerBlack.socket == roomObj.sockets[0]) {
        games[game_id].playerBlack.socket = '';
        games[game_id].playerBlack.username = '';
      }
      // Kick an extra.
      var kicked = Object.keys(roomObject.sockets)[0];
      io.of('/').connected[kicked].leave(game_id);
    }
  } //End Do loop
  while ((numClients - 1) > 2);

  // Assign socket a color
  if ((games[game_id].playerWhite.socket != socket.id) && (games[game_id].playerBlack.socket != socket.id)) {
    console.log('Player : ' + socket.id + 'is not assigned an ID.');

    //edge case
    if ((games[game_id].playerBlack.socket != '') && (games[game_id].playerWhite.socket != '')) {
      games[game_id].playerWhite.socket = '';
      games[game_id].playerWhite.username = '';
      games[game_id].playerBlack.socket = '';
      games[game_id].playerBlack.username = '';
    }
  }

  //Assign colors to the Players
  if (games[game_id].playerWhite.socket == '') {
    if (games[game_id].playerBlack.socket != socket.id) {
      games[game_id].playerWhite.socket = socket.id;
      games[game_id].playerWhite.username = players[socket.id].username;
    }
  }
  if (games[game_id].playerBlack.socket == '') {
    if (games[game_id].playerWhite.socket != socket.id) {
      games[game_id].playerBlack.socket = socket.id;
      games[game_id].playerBlack.username = players[socket.id].username;
    }
  }


  // Send game Update
  var successData = {
    result: 'success',
    game: games[game_id],
    message: message,
    game_id: game_id
  };
  io.in(game_id).emit('game_update', successData);

  // Check to see if game is over
  var row;
  var col;
  var count = 0;
  for (row = 0; row < 8; row++) {
    for (col = 0; col < 8; col++) {
      if (games[game_id].board[row][col] != ' ') {
        count++;
      } //end if
    } //End col for loop
  } //End row for loop
  if (count == 64) {
    var successData = {
      result: 'success',
      game: games[game_id],
      whoWon: 'everyone',
      game_id: game_id
    };

    io.in(game_id).emit('game_over', successData);

    //Delete old games after an hour.
    setTimeout(function(id) {
        return function() {
          delete games[id];
        }
      }(game_id),
      60 * 60 * 1000);
  }


} // end sendGameUpdate()
