var size = 1000;

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
      cell.addEventListener()
    }
  }
}
