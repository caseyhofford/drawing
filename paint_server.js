var fs = require("fs");
var http = require("http");

var xcolors = [];
for(var i = 0; i < 1000; i++)
{
  var ycolors = [];
  for(var j = 0; j < 1000; j++)
  {
    ycolors.push("#FFFFFF");
  }
}

sendCanvas()
{

}

addPaint()
{
  var x_range = ;
  var y = ;
  var color = ;
  xcolors[x][y] = color;
  sendCanvas();
}

serveFile(file,req,res)
{
  var contents = "";
  try {
    contents = fs.readFileSync( filename ).toString();
  }
  catch( e ) {
    console.log(
        "Error: Something bad happened trying to open "+filename );
      res.writeHead( 404 );
      res.end( "" );
      return;
  }

  res.writeHead( 200 );
  res.end( contents );
}

function serverFn(req,res)
{
  if(req.substring(1,15) == request_canvas)
  {
    sendCanvas(req,res);
  }
  else if(req.substring(1,11) == send_paint)
  {
    addPaint();
  }
  else if(filename == 'paint_client.js')
  {
    serveFile('paint_client.js'), res, res);
  }
  else
  {
    serveFile("mosaic.html", req, res);
  }
}

var server = http.createServer(serverFn);
server.listen(8080);
