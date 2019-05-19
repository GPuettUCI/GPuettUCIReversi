// General Functions


// Returns the value associated with the given parameter on the URL
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

$('#messages').append('<h4>' + username + '</h4>');
