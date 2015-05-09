window.onload = load;

var canvas_size = 200;
var cell_size = 3; // Each cell is 3x3 pixels.

var pen_color = "#000000";
var pen_size = 8;

var changedCells = [];

var canvas_mouse_x = 0;
var canvas_mouse_y = 0;
var canvas_left_x = 0;
var canvas_top_y = 0;
var canvas_width = canvas_size;
var canvas_height = canvas_size;

var table, canvasOverlay;
var clickDownFlag = false;
var clickDragFlag = false;

function load()
{
  console.log("Loaded");
  window.setInterval(sendColors, 1000);
  window.setTimeout(
    function() { window.setInterval(pollColors, 1000); },
    500
  );
  setupTable();
  setupCanvasOverlay();
  addMouseListener();
  setupColorSelectors();
}

function setupTable()
{
  table = document.getElementById("tbody");
  for(var i = 0; i < canvas_size; i++)
  {
    var row = document.createElement("tr");
    for (var j = 0; j < canvas_size; j++)
    {
      var cell = document.createElement("td");
      cell.x = i;
      cell.y = j;
      // cell.addEventListener("mousedown", changeCell(i, j, this.style.backgroundColor));
      row.appendChild(cell);
    }
    table.appendChild(row);
  }
}

function setupCanvasOverlay()
{
  canvasOverlay = document.getElementById("canvas_overlay");
  canvas_width = canvasOverlay.offsetWidth;
  canvas_height = canvasOverlay.offsetHeight;
  canvas_left_x = canvasOverlay.getBoundingClientRect().left;
  canvas_top_y = canvasOverlay.getBoundingClientRect().top;
  
  /* This mouse drag detection code adapted from:
   * http://stackoverflow.com/a/6042235/3673087 */
   
  canvasOverlay.addEventListener("mousedown", function(){
      clickDownFlag = true;
      clickDragFlag = false;
      changeCell(canvas_mouse_x/cell_size, canvas_mouse_y/cell_size, pen_color);
  }, false);
  canvasOverlay.addEventListener("mousemove", function(){
      clickDragFlag = true;
      if(clickDownFlag) {
          changeCell(canvas_mouse_x/cell_size, canvas_mouse_y/cell_size, pen_color);
      }
  }, false);
  canvasOverlay.addEventListener("mouseup", function(){
      if(!clickDragFlag || !clickDownFlag) {
          console.log("click");
      }
      else if(clickDragFlag && clickDownFlag) {
          changeCell(canvas_mouse_x/cell_size, canvas_mouse_y/cell_size, pen_color);
          console.log("drag");
      }
      clickDownFlag = false;
  }, false);
}

function addMouseListener()
{
  document.addEventListener("mousemove", function(e) {
    var mouse_x = e.pageX || e.clientX;
    var mouse_y = e.pageY || e.clientY;
    canvas_mouse_x = Math.max(Math.floor(mouse_x - canvas_left_x), 0);
    canvas_mouse_y = Math.max(Math.floor(mouse_y - canvas_top_y), 0);
  }, false);
}

function setupColorSelectors()
{
  var colorSelectors = document.getElementsByClassName("selector");
  for(var i=0; i<colorSelectors.length; i++) {
    colorSelectors.item(i).onclick = changePenColor;
  }
}

function changeCell(x, y, c)
{
  var tableRows = table.getElementsByTagName("tr");
  if(tableRows.length > 0 && y < tableRows.length) {
    for(var i=0; i < pen_size/2; i++) {
      var rowIndex = y+(pen_size/4 - i);
      var row = tableRows.item(rowIndex);
      var tableCells = row.getElementsByTagName("td");
      if(tableCells.length > 0 && x < tableCells.length) {
        for(var j=0; j < pen_size/2; j++) {
          var cellIndex = x+(pen_size/4 - j);
          var cell = tableCells.item(cellIndex);
          cell.style.backgroundColor = c;
          changedCells.push({ x: cellIndex, y: rowIndex, c: c.replace("#","") });
        }
      } else {
        console.log("Error: Couldn't paint cell bc CELL doesn't exist.");
      }
    }
  } else {
    console.log("Error: Couldn't paint cell bc ROW doesn't exist.");
  }
}

function sendColors()
{
  console.log("Sending colors.");
  if(changedCells.length > 0) {
    var url = "change_cells?";
    for(var i=0; i<changedCells.length; i++) {
      var cell = changedCells[i];
      url += "c"+i+"="+cell.x+"-"+cell.y+"-"+cell.c+"&";
    }
    changedCells = [];
    var send_change = new XMLHttpRequest();
    send_change.open("get", url);
    send_change.send();
  }
}

function pollColors()
{
  console.log("Polling colors.");
  var request_colors = new XMLHttpRequest();
  request_colors.startTime = new Date().getTime();
  request_colors.onload = colorsListener;
  request_colors.open( "get", "get_changed_cells" );
  request_colors.send();
}

function colorsListener()
{
  this.endTime = new Date().getTime();
  console.log("Request load time: "+(this.endTime-this.startTime)+". Parsing response...");
  var canvas = JSON.parse(this.responseText);
  if(canvas instanceof Array) {
    var tableRows = table.getElementsByTagName("tr");
    for(var i=0; i<canvas.length; i++) {
      var canvasCells = canvas[i];
      if(canvasCells instanceof Array) {
        var tableRow = tableRows.item(i);
        var tableCells = tableRow.getElementsByTagName("td");
        for(var j=0; j<canvasCells.length; j++) {
          tableCells.item(j).style.backgroundColor = canvasCells[j];
        }
      } else {
        console.log("Response was not a multidimensional array.");
      }
    }
  } else {
    console.log("Response was not an array.");
  }
}

function changePenColor()
{
  pen_color = this.style.backgroundColor;
  console.log("Changed pen color to " + pen_color);
}
