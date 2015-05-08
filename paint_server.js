var fs = require("fs");
var http = require("http");

var CANVAS_SIZE = 1000;

/* Array of objects {x,y,c} representing cells that have been changed. */
var recentlyChangedCells = [];

/* Multidimensional Array storing all columns and rows of colors in the table. */
var canvas = new Array();
for(var i=0; i<CANVAS_SIZE; i++)
{
    canvas[i] = new Array();
    for(var j=0; j<CANVAS_SIZE; j++) {
        canvas[i][j] = "#ffffff";
    }
}

init();

/* Initialize server on specified port. */
function init()
{
    var server = http.createServer( serverFn );

    var port;
    if( process.argv.length < 3 )
    {
        port = 8080;
    }
    else
    {
        port = parseInt( process.argv[2] );
    }

    server.listen( port );
}

function serverFn(req,res)
{
    var filename = req.url.substring( 1, req.url.length );
    
    if(filename === "")
    {
        filename = "./index.html";
    }
    
    if(filename.indexOf("get_changed_cells") > -1)
    {
        sendChangedCells(req, res);
    }
    else if(filename.indexOf("change_cells") > -1)
    {
        // We are changing some cells (maybe).
        filename = "./index.html";
        var urlData = filename.split("change_cells")[1];
        if(urlData.indexOf("?") > -1) {
            // Parse URL into an array of cells.
            var cells = getCellsFromUrl( urlData );
            // Add the specified cells to the cells that need to be updated.
            changeCells( filename, req, res, cells );
        } else {
            // No cells were passed as parameters in the URL, so just return index.html.
            serveFile( filename, req, res );
        }
    }
    else
    {
        serveFile(filename, req, res);
    }
}

/* Parse URL into an array of cells. */
function getCellsFromUrl( urlData )
{
    var queryData = urlData.split("?")[1];
    var fields = queryData.split("&");
    var changedCells = [];
    for(var i=0; i<fields.length; i++) {
        var fieldSplit = fields[i].split("=");
        var fieldValue = fieldSplit[1];
        var cellCoords = fieldValue.split("%2C"); // split on comma. %2C = ,
        if(cellCoords.length === 3)
            changedCells.push({ x: cellCoords[0], y: cellCoords[1], c: cellCoords[2] });
    }
    return changedCells;
}

/* Load a file */
function serveFile( filename, req, res )
{
    try
    {
    	var contents = getFileContents( filename );
    }
    catch( e )
    {
        /* Return a 404 page */
        fourZeroFour(filename, res);
        return;
    }
    
    var extension = "html";
    try {
        extension = filename.split(/.\./)[1];
    } catch(e) {
        // Do nothing.
    }

    res.writeHead( 200, {'Content-Type':'text/'+extension} );
    res.end( contents );
}

/* I think we should really send the function x values 
 * with ranges of y's as pen strokes and change those ranges
 * all at once, not exactly sure how we'd implement this though....
 * could be x, y starting point with a size value that always means
 * a certain sized pen with x,y as a vertex (square pen). */
function sendChangedCells(req, res)
{
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify(recentlyChangedCells));
    // Empty the array.
    recentlyChangedCells = [];
}

function changeCells(filename, req, res, cells)
{
    recentlyChangedCells = cells;
    for(var i=0; i<recentlyChangedCells.length; i++)
    {
        canvas[recentlyChangedCells[i].x][recentlyChangedCells[i].y]
            = recentlyChangedCells[i].c;
    }
    serveFile(filename, req, res);
}

/* Return a 404 page */
function fourZeroFour(filename, res) {
	console.log( "Error: Something bad happened trying to open "+filename );
    res.writeHead(404, {'Content-Type':'text/plain'});
    res.write("404 : File Not Found");
    res.end();
}