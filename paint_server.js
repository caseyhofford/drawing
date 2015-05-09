var fs = require("fs");
var http = require("http");

var CANVAS_SIZE = 200;

/* Array of objects {x,y,c,v} representing cells that have been changed.
 * x = column
 * y = row
 * c = color
 * v = visited */
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
        sendChangedCells( req, res );
    }
    else if(filename.indexOf("change_cells") > -1)
    {
        // We are changing some cells (maybe).
        var urlData = filename.split("change_cells")[1];
        if(urlData.indexOf("?") > -1) {
            // Parse URL into an array of cells.
            var cells = getCellsFromUrl( urlData );
            // Add the specified cells to the cells that need to be updated.
            filename = "./index.html";
            changeCells( filename, req, res, cells );
        } else {
            // No cells were passed as parameters in the URL, so just return index.html.
            filename = "./index.html";
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
        if(fieldSplit.length > 1) {
            var fieldValue = fieldSplit[1];
            var cellCoords = fieldValue.split("-"); // split on dash
            if(cellCoords.length === 3) {
                changedCells.push({
                    x: parseInt(cellCoords[0]),
                    y: parseInt(cellCoords[1]),
                    c: "#"+cellCoords[2],
                    v: false
                });
            }
        }
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
        if(extension === "js") {
            extension = "javascript";
        }
    } catch(e) {
        // Do nothing.
    }

    res.writeHead( 200, {'Content-Type':'text/'+extension} );
    res.end( contents );
}

function getFileContents(filename) {
    return fs.readFileSync( filename ).toString();
}

function sendChangedCells(req, res)
{
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify(canvas));
    /*
    for(var i=0; i<recentlyChangedCells.length; i++) {
        // If the cell has been visited, delete it.
        // But this doesn't work for multiple clients, because there isn't
        // a way to know if all clients have visited these cells.
    }
    recentlyChangedCells = [];
    */
}

function changeCells(filename, req, res, cells)
{
    for(var i=0; i<cells.length; i++) {
        /* TODO loop through this array and check to see if this cell already exists. 
         * If so, should just update the color value instead of pushing the whole cell
         * into the array. This might be why the server isn't "remembering" all the cells. */
        recentlyChangedCells.push(cells[i]);
    }
    var cell;
    for(i=0; i<recentlyChangedCells.length; i++)
    {
        cell = recentlyChangedCells[i];
        if(!cell.v) {
            cell.v = true;
            canvas[cell.y][cell.x] = cell.c;
        }
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