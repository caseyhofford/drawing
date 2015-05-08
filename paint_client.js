var size = 1000;

var pen_color = "#00000";
var pen_size = 1;

function load()
{
  var table = getElementById("table");
  for(var i = 0; i < size; i++)
  {
    var row = table.appendChild("tr");
    for (var j = 0; j < size; j++)
    {
      var cell = row.appendChild(td);
      cell.x = i;
      cell.y = j;
      cell.addEventListener(onmousedown, sendColor(i,j));
      cell.addEventListener(onmousemove, sendColor(i,j));
    }
  }
}

function sendColor(x,y)
{
  var url = "change_cells?x="+x+"&y="+y+"&color="+pen_color;
  var send_change = new XMLHttpRequest;
  send.change.open("get", url);
  send.change.send();
}

function changePenColor()
{
  var color = this.id;
  //here we could either use hex color codes to specify color or keep the color name and specify the css color just by name.
  pen_color = color;
}
