// General Functions


// Returns the value associated with the given parameter on the URL
// Used for getting usernames from inputs
function getURLParams(param) {
  var pageURL = window.location.search.substring(1);
  var pageURLVars = pageURL.split('&');
  for (var i = 0; i < pageURLVars.length; i++) {
    var paramName = pageURLVars[i].split('=');
    if (paramName[0] == param) {
      return paramName[1];
    }
  }
}
var username = getURLParams('username');
if (typeof username == 'undefined' || !username) {
  username = 'Anonymous_' + Math.floor(Math.random() * 1000);
}

//////////////////////////////////
// Connect to the socket server //
//////////////////////////////////
var socket = io.connect();

var gifReloader = 0;

////////////////////////
// Server Log Message //
////////////////////////
socket.on('log', function(array) {
  console.log.apply(console, array);
});

////////////////////////
// Join Room Response //
////////////////////////
socket.on('join_room_response', function(payload) {
  if (payload.result == 'fail') {
    alert(payload.message);
    return;
  }
  // if notified that we joined the room, ignore it.
  if (payload.socket_id == socket.id) {
    return
  }

  // Add new row if someone joins.
  var domElements = $('.socket_' + payload.socket_id);
  if (domElements.length == 0) {
    var node1 = $('<div></div>')
    node1.addClass('socket_' + payload.socket_id);
    var node2 = $('<div></div>')
    node2.addClass('socket_' + payload.socket_id);
    var node3 = $('<div></div>')
    node3.addClass('socket_' + payload.socket_id);

    node1.addClass('w-100');

    node2.addClass('col-6 text-right')
    node2.append('<b><font size = "5">' + payload.username + '</font></b>')

    node3.addClass('col-6 text-left')
    var button3 = makeInviteButton(payload.socket_id);
    node3.append(button3);

    node1.hide();
    node2.hide();
    node3.hide();

    $('#players').append(node1, node2, node3);

    node1.slideDown(1000);
    node2.slideDown(1000);
    node3.slideDown(1000);
  } else {
    uninvite(payload.socket_id);
    var button3 = makeInviteButton(payload.socket_id);
    $('.socket_' + payload.socket_id + ' button').replaceWith(button3);
    domElements.slideDown(1000);
  }


  // New player Join Message
  var newHTML = '<p><b>' + payload.username + '</b> has joined</p>';
  var newNode = $(newHTML);
  newNode.hide();
  $('#messages').prepend(newNode);
  newNode.slideDown(1000);
  newNode.delay(60000);
  newNode.fadeOut(1000);
});

/////////////////////////
// Disconnect Response //
/////////////////////////
socket.on('player_disonnected', function(payload) {
  if (payload.result == 'fail') {
    alert(payload.message);
    return;
  }
  // if notified that we joined the room, ignore it.
  if (payload.socket_id == socket.id) {
    return
  }

  // Remove all their content if they disconnect
  var domElements = $('.socket_' + payload.socket_id);
  if (domElements.length != 0) {
    domElements.slideUp(1000);
  }


  // Player leave Message
  var newHTML = '<p><b>' + payload.username + '</b> disconnected</p>';
  var newNode = $(newHTML);
  newNode.hide();
  $('#messages').append(newNode);
  newNode.slideDown(1000);
  newNode.delay(60000);
  newNode.fadeOut(1000);
});



//////////////
// Inviting //
//////////////

// Invite Function
function invite(who) {
  var payload = {};
  payload.requested_user = who;
  console.log('***Client Log message: invite function payload: ' + JSON.stringify(payload));

  socket.emit('invite', payload);
}

// Invite response
socket.on('invite_response', function(payload) {
  if (payload.result == 'fail') {
    alert(payload.message);
    return;
  }
  var newNode = makeInvitedButton(payload.socket_id);
  $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
});

// Invited response / play button
socket.on('invited', function(payload) {
  if (payload.result == 'fail') {
    alert(payload.message);
    return;
  }
  var newNode = makePlayButton(payload.socket_id);
  $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
});




////////////////
// Uninviting //
////////////////

// Uninvite Function
function uninvite(who) {
  var payload = {};
  payload.requested_user = who;
  console.log('***Client Log message: uninvite function payload: ' + JSON.stringify(payload));

  socket.emit('uninvite', payload);
}

// Uninvite response
socket.on('uninvite_response', function(payload) {
  if (payload.result == 'fail') {
    alert(payload.message);
    return;
  }
  var newNode = makeInviteButton(payload.socket_id);
  $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
}); //End uninvite response

// UnInvited response / revert to invite button
socket.on('uninvited', function(payload) {
  if (payload.result == 'fail') {
    alert(payload.message);
    return;
  }
  var newNode = makeInviteButton(payload.socket_id);
  $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
}); //End uninvited



////////////////
// Game Start //
////////////////

// Game Start response
socket.on('game_start_response', function(payload) {
  if (payload.result == 'fail') {
    alert(payload.message);
    return;
  }
  var newNode = makeEngagedButton(payload.socket_id);
  $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);

  //Go to new page
  window.location.href = 'game.html?username=' + username + '&game_id=' + payload.game_id;
}); //End Game Start Response


//////////
// Chat //
//////////

var chatRoom = getURLParams('game_id');
if (typeof chatRoom == 'undefined' || !chatRoom) {
  chatRoom = 'lobby';
}

// Send Message Response
socket.on('send_message_response', function(payload) {
  if (payload.result == 'fail') {
    alert(payload.message);
    return;
  }
  var newHTML = '<p><b>' + payload.username + ':</b> ' + payload.message + '</p>';
  var newNode = $(newHTML);
  newNode.hide()
  $('#messages').prepend(newNode);
  newNode.slideDown(1000);
  newNode.delay(60000);
  newNode.fadeOut(1000);
}); //End Send Message Response


//////////////
// Gameplay //
//////////////
var oldBoard = [
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?']
]

var myColor = ' ';
var intervalTimer;

socket.on('game_update', function(payload) {
  console.log('*** Client Log Message: game_update: payload: ' + JSON.stringify(payload));


  //Check for good board Update
  if (payload.result == 'fail') {
    console.log(payload.message);
    window.location.href = 'lobby.html?username=' + username;
    alert(payload.message);
    return;
  }


  //Check for a good board in payload
  var board = payload.game.board;
  if (typeof board == 'undefined' || !board) {
    console.log('Internal error: received a malformed board update from server');
    return;
  }


  //Update my my_color
  if (socket.id == payload.game.playerWhite.socket) {
    myColor = 'white';
  } else if (socket.id == payload.game.playerBlack.socket) {
    myColor = 'black';
  } else {
    //Edge case catch. Return client to lobby.
    window.location.href = 'lobby.html?username=' + username;
  }
  $('#my_color').html('<h3 id="my_color">I am ' + myColor + '</h3>');
  $('#my_color').append('<h4>' + payload.game.currentTurn + '\'s turn</h4>')
  $('#my_color').append('<h4>Time: <span id = "timer"></span></h4>')

  clearInterval(intervalTimer);
  intervalTimer = setInterval(function(lastTime) {
    return function() {
      //update ui
      var date = new Date();
      var passedTime = date.getTime() - lastTime;
      var min = Math.floor(passedTime / (60 * 1000));
      var sec = Math.floor((passedTime % (60 * 1000)) / 1000);
      if (sec < 10) {
        $('#timer').html(min + ':0' + sec)
      } else {
        $('#timer').html(min + ':' + sec)
      }

    }
  }(payload.game.lastMoveTime), 1000);

  //Animate changes to board.
  var whiteTotal = 0;
  var blackTotal = 0;
  var row;
  var col;
  for (row = 0; row < 8; row++) {
    for (col = 0; col < 8; col++) {
      if (board[row][col] == 'w') {
        whiteTotal++;
      }
      if (board[row][col] == 'b') {
        blackTotal++;
      }

      if (oldBoard[row][col] != board[row][col]) {
        if (oldBoard[row][col] == '?' && board[row][col] == ' ') {
          $('#' + row + '_' + col).html('<img src="assets/images/empty.gif?' + gifReloader + '" alt="Empty square" />');
        } else if (oldBoard[row][col] == 'w' && board[row][col] == ' ') {
          $('#' + row + '_' + col).html('<img src="assets/images/whiteToEmpty.gif?' + gifReloader + '" alt="Empty square" />');
        } else if (oldBoard[row][col] == 'b' && board[row][col] == ' ') {
          $('#' + row + '_' + col).html('<img src="assets/images/blackToEmpty.gif?' + gifReloader + '" alt="Empty square" />');
        } else if (oldBoard[row][col] == '?' && board[row][col] == 'w') {
          $('#' + row + '_' + col).html('<img src="assets/images/emptyToWhite.gif?' + gifReloader + '" alt="White square" />');
        } else if (oldBoard[row][col] == ' ' && board[row][col] == 'w') {
          $('#' + row + '_' + col).html('<img src="assets/images/emptyToWhite.gif?' + gifReloader + '" alt="White square" />');
        } else if (oldBoard[row][col] == 'b' && board[row][col] == 'w') {
          $('#' + row + '_' + col).html('<img src="assets/images/blackToWhite.gif?' + gifReloader + '" alt="White square" />');
        } else if (oldBoard[row][col] == '?' && board[row][col] == 'b') {
          $('#' + row + '_' + col).html('<img src="assets/images/emptyToBlack.gif?' + gifReloader + '" alt="Black square" />');
        } else if (oldBoard[row][col] == ' ' && board[row][col] == 'b') {
          $('#' + row + '_' + col).html('<img src="assets/images/emptyToBlack.gif?' + gifReloader + '" alt="Black square" />');
        } else if (oldBoard[row][col] == 'w' && board[row][col] == 'b') {
          $('#' + row + '_' + col).html('<img src="assets/images/whiteToBlack.gif?' + gifReloader + '" alt="Black square" />');
        } else {
          $('#' + row + '_' + col).html('<img src="assets/images/error.gif?' + gifReloader + '" alt="Error" />');
        } //end inner if/else chain
      } //end old vs new compare
      gifReloader++;

      //Interactivity
      $('#' + row + '_' + col).off('click');
      $('#' + row + '_' + col).removeClass('hovered_over');
      if (payload.game.currentTurn === myColor) {
        if (payload.game.legalMoves[row][col] === myColor.substr(0, 1)) {
          $('#' + row + '_' + col).addClass('hovered_over');
          $('#' + row + '_' + col).click(function(r, c) {
            return function() {
              var payload = {};
              payload.row = r;
              payload.column = c;
              payload.color = myColor;
              console.log('*** Client log message: play token: payload: ' + JSON.stringify(payload));
              socket.emit('play_token', payload);
            };
          }(row, col));
        } //end if legal moves === color
      } //end if current turn = myColor

    } //End column for loop
  } //End row for loop

  $('#whiteTotal').html('<font size = "5">' + whiteTotal + '</font>');
  $('#blackTotal').html('<font size = "5">' + blackTotal + '</font>');

  oldBoard = board;

}); //end game_update


socket.on('play_token_response', function(payload) {
  console.log('*** Client Log Message: play_token_response: payload: ' + JSON.stringify(payload));

  //Check for good play_token_response
  if (payload.result == 'fail') {
    console.log(payload.message);
    alert(payload.message);
    return;
  }

}); //end play_token_response

socket.on('game_over', function(payload) {
  console.log('*** Client Log Message: Game over message: payload: ' + JSON.stringify(payload));

  //Check for good game over message
  if (payload.result == 'fail') {
    console.log(payload.message);
    return;
  }

  //Jump to a new page
  $('#game_over').html('<h1>Game Over</h1><h2>' + payload.whoWon + ' wins</h2>');
  $('#game_over').append('<a href="lobby.html?username=' + username + '" class = "btn btn-success btn-lg active" role = "button" aria-pressed = "true">Lobby</a>');
}); //end game_over
// END GAMEPLAY //

///////////////////
//// Functions ////
///////////////////

// Send message Function (called on submit by lobby and game.html)
function sendMessage() {
  var payload = {};
  payload.room = chatRoom;
  payload.message = $('#send_message_holder').val();
  console.log('*** Client Log Message: send_message: payload: ' + JSON.stringify(payload));
  socket.emit('send_message', payload);
  $('#send_message_holder').val('');
} //End sendMessage()

function makeInviteButton(socket_id) {
  var newHTML = '<button type= \'button\' class=\'btn btn-outline-primary\'>Invite</button>';
  var newNode = $(newHTML);
  newNode.click(function() {
    invite(socket_id);
  });
  return (newNode);
} //End makeInviteButton(socket_id)

function makeInvitedButton(socket_id) {
  var newHTML = '<button type= \'button\' class=\'btn btn-primary\'>Invited</button>';
  var newNode = $(newHTML);
  newNode.click(function() {
    uninvite(socket_id);
  });
  return (newNode);
} //End makeInvitedButton(socket_id)

function makePlayButton(socket_id) {
  var newHTML = '<button type= \'button\' class=\'btn btn-success\'>Play</button>';
  var newNode = $(newHTML);
  newNode.click(function() {
    gameStart(socket_id);
  });
  return (newNode);
} //End makePlayButton(socket_id)

function makeEngagedButton() {
  var newHTML = '<button type= \'button\' class=\'btn btn-danger\'>Engaged</button>';
  var newNode = $(newHTML);
  return (newNode);
} //End makeEngagedButton()

// Game Start Function
function gameStart(who) {
  var payload = {};
  payload.requested_user = who;
  console.log('***Client Log message: Game start called: payload: ' + JSON.stringify(payload));

  socket.emit('game_start', payload);
} // end gameStart(who)

$(function() {
  var payload = {};
  payload.room = chatRoom;
  payload.username = username;

  console.log('*** Client Log Message: \'join room\' payload: ' + JSON.stringify(payload));
  socket.emit('join_room', payload);

  $('#quit').append('<a href="lobby.html?username=' + username + '" class = "btn btn-danger btn-lg active" role = "button" aria-pressed = "true">Quit</a>');
}); //end function()
