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

socket.on('log', function(array) {
  console.log.apply(console,array);
});

socket.on('join_room_response', function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  $('#messages').append('<p>' + payload.username + ' joined the room.</p>');
});

// Chat stuff
var chatRoom = 'oneRoom';
$(function(){
  var payload = {};
  payload.room = chatRoom;
  payload.username = username;

  console.log('*** Client Log Message: \'join room\' payload: ' + JSON.stringify(payload));
  socket.emit('join_room',payload);
});
