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

    node2.addClass('col-9 text-right')
    node2.append('<h4><b>' + payload.username + '</b></h4>')

    node3.addClass('col-3 text-left')
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
  var newHTML = '<p><b>' + payload.username + '</b> has entered the lobby</p>';
  var newNode = $(newHTML);
  newNode.hide();
  $('#messages').append(newNode);
  newNode.slideDown(1000);
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
});

// UnInvited response / revert to invite button
socket.on('uninvited', function(payload) {
  if (payload.result == 'fail') {
    alert(payload.message);
    return;
  }
  var newNode = makeInviteButton(payload.socket_id);
  $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
});



////////////////
// Game Start //
////////////////

// Game Start Function
function gameStart(who) {
  var payload = {};
  payload.requested_user = who;
  console.log('***Client Log message: Game start called: payload: ' + JSON.stringify(payload));

  socket.emit('game_start', payload);
}

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
});


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
  $('#messages').append(newNode);
  newNode.slideDown(1000);
});



///////////////////
//// Functions ////
///////////////////

// Send message Function
function send_message() {
  var payload = {};
  payload.room = chatRoom;
  payload.message = $('#send_message_holder').val();
  console.log('*** Client Log Message: \'send_message\' payload: ' + JSON.stringify(payload));
  socket.emit('send_message', payload);
}

function makeInviteButton(socket_id) {
  var newHTML = '<button type= \'button\' class=\'btn btn-outline-primary\'>Invite</button>';
  var newNode = $(newHTML);
  newNode.click(function() {
    invite(socket_id);
  });
  return (newNode);
}

function makeInvitedButton(socket_id) {
  var newHTML = '<button type= \'button\' class=\'btn btn-primary\'>Invited</button>';
  var newNode = $(newHTML);
  newNode.click(function() {
    uninvite(socket_id);
  });
  return (newNode);
}

function makePlayButton(socket_id) {
  var newHTML = '<button type= \'button\' class=\'btn btn-success\'>Play</button>';
  var newNode = $(newHTML);
  newNode.click(function() {
    gameStart(socket_id);
  });
  return (newNode);
}

function makeEngagedButton() {
  var newHTML = '<button type= \'button\' class=\'btn btn-danger\'>Engaged</button>';
  var newNode = $(newHTML);
  return (newNode);
}

$(function() {
  var payload = {};
  payload.room = chatRoom;
  payload.username = username;

  console.log('*** Client Log Message: \'join room\' payload: ' + JSON.stringify(payload));
  socket.emit('join_room', payload);
});
