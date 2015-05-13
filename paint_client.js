window.onload = load;

var canvas_size = 200;
var cell_size = 3; // Each cell is 3x3 pixels.

var pen_color = "black";
var pen_size = 8; // This must always be a multiple of 4.
var brushSizeSelectors;

var changedCells = [];
var clickedCells = [];
var lastCell;

var canvas_mouse_x = 0;
var canvas_mouse_y = 0;
var canvas_left_x = 0;
var canvas_top_y = 0;

var table, canvasOverlay;
var clickDownFlag = false;
var clickDragFlag = false;

var tableArray = [];

var DO_SMOOTH_EFFECT = true;

function load()
{
  console.log("Loaded");
  setupTable();
  setupCanvasOverlay();
  addMouseListener();
  setupColorSelectors();
  window.setInterval(pollColors, 200);
  window.setTimeout(
    function() { window.setInterval(sendColors, 100); },
    100
  );
}

function setupTable()
{
  table = document.getElementById("tbody");
  for(var i = 0; i < canvas_size; i++)
  {
    var rowArray = [];
    var row = document.createElement("tr");
    for (var j = 0; j < canvas_size; j++)
    {
      var cell = document.createElement("td");
      cell.x = i;
      cell.y = j;
      cell.lastUpdated = new Date().getTime();
      cell.style.backgroundColor = "#ffffff";
      // cell.addEventListener("mousedown", changeCell(i, j, this.style.backgroundColor));
      row.appendChild(cell);
      rowArray.push(cell);
    }
    table.appendChild(row);
    tableArray.push(rowArray);
  }
}

function setupCanvasOverlay()
{
  canvasOverlay = document.getElementById("canvas_overlay");
  canvas_left_x = canvasOverlay.getBoundingClientRect().left;
  canvas_top_y = canvasOverlay.getBoundingClientRect().top;

  /* This mouse drag detection code adapted from:
   * http://stackoverflow.com/a/6042235/3673087 */

  canvasOverlay.addEventListener("mousedown", function() {
      clickDownFlag = true;
      clickDragFlag = false;
      clickCell();
  }, true);
  canvasOverlay.addEventListener("mousemove", function() {
      clickDragFlag = true;
      if(clickDownFlag) {
        clickCell();
      }
  }, true);
  document.addEventListener("mouseup", function() {
      if(!clickDragFlag || !clickDownFlag) {
          console.log("click");
      }
      else if(clickDragFlag && clickDownFlag) {
          clickCell();
          console.log("drag");
      }
      changeClickedCells();
      clickDownFlag = false;
      lastCell = null;
  }, true);
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
    if(i !== colorSelectors.length - 1) {
      colorSelectors.item(i).onclick = changePenColor;
    } else {
      colorSelectors.item(i).onclick = openColorInput;
      colorSelectors.item(i).getElementsByTagName("input").item(0).oninput = changePenColorInput;
    }
  }
  var clearButton = document.getElementById("clear");
  clearButton.onclick = clearCanvas;
  brushSizeSelectors = document.getElementsByClassName("brush");
  for(i=0; i<brushSizeSelectors.length; i++) {
    brushSizeSelectors.item(i).onclick = changePenSize;
  }
}

function changePenColor()
{
  pen_color = this.style.backgroundColor;
  console.log("Changed pen color to " + pen_color);
}

function openColorInput()
{
  console.log("Detected color input click.");
  this.getElementsByTagName("input").item(0).click();
}

function changePenColorInput(e)
{
  pen_color = this.value;
  this.parentNode.style.backgroundColor = pen_color;
  console.log("Changed pen color to " + pen_color);
}

function changePenSize()
{
  pen_size = parseInt(this.getAttribute("data-size"));
  for(var i=0; i<brushSizeSelectors.length; i++) {
    var brush = brushSizeSelectors.item(i);
    if(brush === this) {
      brush.className = "brush selected";
    } else {
      brush.className = "brush";
    }
  }
}

function clearCanvas()
{
  var send_change = new XMLHttpRequest();
  send_change.open("get", "clear_canvas");
  send_change.send();
}

function clickCell(cell, notSmooth)
{
  var x = Math.round(canvas_mouse_x/cell_size);
  var y = Math.round(canvas_mouse_y/cell_size);
  //var cellToSmooth;
  //console.log(x+":"+y);

  if(cell) {
    x = cell.x;
    y = cell.y;
  }
  if(!lastCell)
  {
    lastCell = tableArray[y][x];
  }
  var c = pen_color;
  for(var i=0; i<pen_size/2; i++) {
    for(var j=0; j<pen_size/2; j++) {
      var cellIndex = x + (pen_size/4 - i);
      var rowIndex = y + (pen_size/4 - j);
      try {
        var tableCell = tableArray[rowIndex][cellIndex];
        //console.log(tableCell);
        tableCell.style.backgroundColor = c;
        tableCell.lastUpdated = new Date().getTime();
        if(clickedCells.indexOf(tableCell) === -1)
        {
          clickedCells.push(tableCell); //,pen color?
        }

      } catch(e) {
        console.log("Error: Couldn't paint cell ["+rowIndex+", "+cellIndex+"]:"+e);
      }
    }
  }
  
  // return;  // Comment out this line to execute the "smoothing" code.
  
  if(DO_SMOOTH_EFFECT && (typeof notSmooth === 'undefined' || !notSmooth)) {
    var xAbsDiff = Math.abs(lastCell.x - x);
    var yAbsDiff = Math.abs(lastCell.y - y);
    console.log("AbsDiff: "+xAbsDiff+":"+yAbsDiff);
    if(xAbsDiff >= pen_size/4 && yAbsDiff >= pen_size/4)
    {
      // console.log(tableArray[y][x]);
      var cellToSmooth = tableArray[y][x];
      if(cellToSmooth) {
        try {
          var smoothCells = smooth(cellToSmooth);
          for(var k=0; k<smoothCells.length; k++) {
            var sCell = smoothCells[k];
            if(!sCell)
              continue;
            var cellAbsDiffX = Math.abs(lastCell.x - sCell.x);
            var cellAbsDiffY = Math.abs(lastCell.y - sCell.y);
            console.log("cellAbsDiff: "+xAbsDiff+":"+yAbsDiff);
            if(cellAbsDiffX <= xAbsDiff && cellAbsDiffY <= yAbsDiff &&
                ( (x < lastCell.x && sCell.x > lastCell.x) || (x > lastCell.x && sCell.x < lastCell.x) ) &&
                ( (y < lastCell.y && sCell.y > lastCell.y) || (y > lastCell.y && sCell.y < lastCell.y) )) {
                
              clickCell(sCell, true);
              
            }
          }
        }
        catch(e)
        {
          // console.log(e.message);
        }
        lastCell = cellToSmooth;
      }
    }
  }
}

function changeClickedCells()
{
  // console.log("MOUSEUP. Clicked "+clickedCells.length+" cells.");
  for(var i=0; i<clickedCells.length; i++) {
    changedCells.push(clickedCells[i]);
  }
  clickedCells = [];
}

function sendColors()
{
  // console.log("Sending colors.");
  if(changedCells.length > 0) {
    var url = "change_cells?";
    var i;
    for(i=0; i<changedCells.length; i++) {
      var cell = changedCells[i];
      //console.log(cell);
      //newColorHash = cell.style.backgroundColor;
      //newColor = newColorHash.replace("#","");
      //console.log(cell.x);
      var newData = "c"+i+"="+cell.x+"-"+cell.y+"-"+pen_color+"&";
      url += newData;
    }
    // console.log("SENDING. Url has "+i+" cells.");
    changedCells = [];
    var send_change = new XMLHttpRequest();
    send_change.open("get", url);
    send_change.send();
  }
}

function pollColors()
{
  // console.log("Polling colors.");
  var request_colors = new XMLHttpRequest();
  request_colors.startTime = new Date().getTime();
  request_colors.onload = colorsListener;
  request_colors.open( "get", "get_changed_cells" );
  request_colors.send();
}

function colorsListener()
{
  this.endTime = new Date().getTime();
  //console.log("Request load time: "+(this.endTime-this.startTime)+". Parsing response...");
  var canvas = JSON.parse(this.responseText);
  var cellCount = 0;
  var changedCellCount = 0;
  if(canvas instanceof Array) {
    for(var i=0; i<canvas.length; i++) {
      var canvasRow = canvas[i];
      var tableRow = tableArray[i];
      if(tableRow && canvasRow instanceof Array) {
        for(var j=0; j<canvasRow.length; j++) {
          var cellColor = canvasRow[j];
          var tableCell = tableRow[j];
          if(tableCell) {
            cellCount++;
            var currentColor = tableCell.style.backgroundColor;
            if(!colorsSame(currentColor, cellColor) &&
                this.startTime - tableCell.lastUpdated > 0 &&
                changedCells.indexOf(tableCell) === -1 &&
                clickedCells.indexOf(tableCell) === -1) {

              changedCellCount++;
              tableCell.style.backgroundColor = cellColor;

            } else {
              // console.log("Warning: Cell ["+i+", "+j+"] has been updated on the client more recently than the server. Won't overwrite.");
            }
          } else {
            console.log("Error: Response did not match table cell.");
          }
        }
      } else {
        console.log("Error: Response was not a multidimensional array.");
      }
    }
  } else {
    console.log("Error: Response was not an array.");
  }
  // console.log("DONE PARSING. Response changed "+changedCellCount+" cells ("+cellCount+" total).");
}

function colorsSame(color1, color2) {
  var same = false;
  if(color1 === color2) {
    same = true;
  } else {
    if(color1.toString().indexOf("#") > -1 && color2.toString().indexOf("rgb") > -1) {
      color1 = hexToRgb(color1);
    } else if(color2.toString().indexOf("#") > -1 && color1.toString().indexOf("rgb") > -1) {
      color2 = hexToRgb(color2);
    }
    if(color1 === color2) {
      same = true;
    }
  }
  return same;
}

/* This function from http://stackoverflow.com/a/5624139/3673087 */
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        "rgb(" + parseInt(result[1], 16) + ", " +
        parseInt(result[2], 16) + ", " +
        parseInt(result[3], 16) + ")"
    : null;
}

function smooth(newCell)
{
  // console.log("new:"+newCell+"old:"+lastCell);
  var pen_radius = pen_size/2;
  //var right, down
  var newCellX = newCell.x;
  var newCellY = newCell.y;
  var lastCellX = lastCell.x;
  var lastCellY = lastCell.y;
  var xDiff = newCellX-lastCellX;
  var xDiffAbs = Math.abs(xDiff)*cell_size;
  var yDiff = newCellY-lastCellY;
  var yDiffAbs = Math.abs(yDiff);

  var cellsToAdd = [];
  
  // console.log("x:"+newCellX+" y:"+newCellY);
  // console.log(lastCell);
  // console.log("new: "+newCellX+"old: "+lastCellX);
  var new1, new0;
  var slope = (newCellX-lastCellX)/(newCellY-lastCellY);
  for (var i = 1; i < xDiffAbs; i+=cell_size)
  {
    if(!isFinite(slope) || slope > 15 || slope < -15)
    {
      if(xDiff > 0) //move down
      {
        new1 = lastCellY;
        new0 = lastCellX + i;
      }
      else if (xDiff < 0) //move up
      {
        new1 = lastCellY;
        new0 = lastCellX - i;
      }
    }
    else if (isFinite(slope) && !isNaN(slope) && slope !== 0)
    {
      // console.log("x: "+xDiff+" y: "+yDiff);
      if ((xDiff>0 && yDiff>0) || (xDiff<0 && yDiff>0)) //down,right
      {
        new0 = Math.floor(lastCellX+(slope*i));
        new1 = Math.floor(lastCellY+i);
      }
      // console.log(i+"[0]:"+new0);
      else if((xDiff<0 && yDiff<0)||(xDiff>0 && yDiff<0)) //up,left
      {
        new0 = Math.floor(lastCellX+(slope*(-i)));
        new1 = Math.floor(lastCellY-i);
      }
    }
    cellsToAdd.push(tableArray[new1][new0]);
  }
  /*console.log("0:"+new0+" 1:"+new1);
  var url = "build_array?zero="+new0+"&one="+new1+"&color="+pen_color+"&size="+pen_radius;
  var build_array = new XMLHttpRequest;
  build_array.onload = colorsListener;
  build_array.open("get", url);
  build_array.send();*/
  return cellsToAdd;
}
