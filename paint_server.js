var fs = require("fs");
var http = require("http");

var CANVAS_SIZE = 200;

/* Multidimensional Array storing all columns and rows of colors in the table. */
var canvas = [];

init();

/* Initialize server on specified port. */
function init()
{
    resetCanvas();
    
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

function resetCanvas()
{
    canvas = [];
    for(var i=0; i<CANVAS_SIZE; i++)
    {
        canvas[i] = [];
        for(var j=0; j<CANVAS_SIZE; j++) {
            canvas[i][j] = "#ffffff";
        }
    }
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
            getCellsFromUrl( urlData );
            filename = "./index.html";
            serveFile( filename, req, res );
        } else {
            // No cells were passed as parameters in the URL, so just return index.html.
            filename = "./index.html";
            serveFile( filename, req, res );
        }
    }
    else if(filename.indexOf("clear_canvas") > -1)
    {
        // Clear the canvas
        resetCanvas();
        filename = "./index.html";
        serveFile(filename, req, res);
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
    var i;
    for(i=0; i<fields.length; i++) {
        var fieldSplit = fields[i].split("=");
        if(fieldSplit.length > 1) {
            var fieldValue = fieldSplit[1];
            var cellCoords = fieldValue.split("-"); // split on dash
            if(cellCoords.length === 3) {
                var x = parseInt(cellCoords[0]);
                var y = parseInt(cellCoords[1]);
                var color = cellCoords[2];
                var rgb = color.replace(/%20/g, "").match(/([0-9]+)(?:,|\))/g);
                if(!isNaN(parseInt(color, 16)) && color.length === 6) {
                    color = "#"+cellCoords[2];
                } else if(rgb) {
                    if(rgb.length === 3) {
                        color = rgbToHex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
                    }
                }
                try {
                    canvas[x][y] = color;
                } catch(e) {
                    console.log("Error: Couldn't find specified cell from URL in the canvas.");
                }
            }
        }
    }
    // console.log("PARSED. Received "+i+" cells to change, give or take 1.");
}

/* This function from http://stackoverflow.com/a/5624139/3673087 */
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/* Load a file */
function serveFile( filename, req, res )
{
    var contents;
    try
    {
    	contents = getFileContents( filename );
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
}

/* Return a 404 page */
function fourZeroFour(filename, res) {
	console.log( "Error: Something bad happened trying to open "+filename );
    res.writeHead(404, {'Content-Type':'text/plain'});
    res.write("404 : File Not Found");
    res.end();
}