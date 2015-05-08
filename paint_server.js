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

sendCanvas(x,y)//I think we should really send the function x values with ranges of y's as pen strokes and change those ranges all at once, not exactly sure how we'd implement this though.... could be x, y starting point with a size value that always means a certain sized pen with x,y as a vertex (square pen).
{
  res.writeHead(200);
  var changed_cell = xcolors[x][y];
  res.end(JSON.stringify(changed_cell));f
}

addPaint(req, res)
{
  var input = req.substring(11).split("&");
  var x = input[0].split("=")[1];//maybe should be a couple lines of code?
  var y = /input[1].split("=")[1];
  var color = input[2].split("=")[1];
  //var size = input[3].split("=")[1];
  xcolors[x][y] = color;//with size idea this would be in two for loops
  sendCanvas(x,y);
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
    addPaint(req, res);
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
