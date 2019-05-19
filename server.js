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
});
