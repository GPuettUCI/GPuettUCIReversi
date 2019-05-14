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
