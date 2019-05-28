// General Functions


// Returns the value associated with the given parameter on the URL
// Used for getting usernames from inputs
function getURLParams(param)
{
  var pageURL = window.location.search.substring(1);
  var pageURLVars = pageURL.split('&');
  for(var i=0; i<pageURLVars.length; i++)
  {
    var paramName = pageURLVars[i].split('=');
    if(paramName[0] == param)
    {
      return paramName[1];
    }
  }
}
var username = getURLParams('username');
if(typeof username == 'undefined' || !username)
{
  username = 'Anonymous_'+ Math.floor(Math.random() * 1000);
}

// Connect to the socket server
var socket = io.connect();

// Called when server sends a log message.
socket.on('log', function(array) {
  console.log.apply(console,array);
});


// Called when server responds that someone joined a room.
socket.on('join_room_response', function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  // if notified that we joined the room, ignore it.
  if(payload.socket_id == socket.id){
    return
  }

// Add new row if someone joins.
  var domElements = $('.socket_' + payload.socket_id);
  if (domElements.length == 0){
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
      var button3 = makeInviteButton();
      node3.append(button3);

      node1.hide();
      node2.hide();
      node3.hide();

      $('#players').append(node1, node2, node3);

      node1.slideDown(1000);
      node2.slideDown(1000);
      node3.slideDown(1000);
  }
  else{
    var button3 = makeInviteButton();
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

// Called when server responds that someone leaves a room.
socket.on('player_disonnected', function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  // if notified that we joined the room, ignore it.
  if(payload.socket_id == socket.id){
    return
  }

  // Remove all their content if they disconnect
  var domElements = $('.socket_' + payload.socket_id);
  if (domElements.length != 0){
      domElements.slideUp(1000);
  }


  // Player leave Message
  var newHTML = '<p><b>' + payload.username + '</b> disconnected</p>';
  var newNode = $(newHTML);
  newNode.hide();
  $('#messages').append(newNode);
  newNode.slideDown(1000);
});

// Chat stuff
var chatRoom = getURLParams('game_id');
if(typeof chatRoom == 'undefined' || !chatRoom)
{
  chatRoom = 'lobby';
}

socket.on('send_message_response', function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  $('#messages').append('<p><b>' + payload.username + ':</b> ' + payload.message + '</p>');
});

function send_message()
{
  var payload = {};
  payload.room = chatRoom;
  payload.username = username;
  payload.message = $('#send_message_holder').val();
  console.log('*** Client Log Message: \'send_message\' payload: ' + JSON.stringify(payload));
  socket.emit('send_message',payload);
}

function makeInviteButton()
{
    var newHTML = '<button type= \'button\' class=\'btn btn-outline-primary\'>Invite</button>';
    var newNode = $(newHTML);
    return (newNode);
}

$(function(){
  var payload = {};
  payload.room = chatRoom;
  payload.username = username;

  console.log('*** Client Log Message: \'join room\' payload: ' + JSON.stringify(payload));
  socket.emit('join_room',payload);
});
