var http = require('http');
var fs = require('fs');

var field = createField('r', 'b', 's');


var state = {
  "field": field
}

function createField(player1, player2, swamp) {
  var f = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''].map(function (o, x) {
    return ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''].map(function (p, y) {
      if ((x == 0 && y == 0) || (x == 0 && y == 23) || (x == 23 && y == 0) || (x == 23 && y == 23)) {
        return swamp;
      }
      if (x == 0 || x == 23)
        return player1;
      if (y == 0 || y == 23)
        return player2;
      return '';
    });
  });
  for (var x = 2; x < 22; x++) {
    for (var y = 2; y < 22; y++) {
      if (Math.random() > 0.6 && f[x][y] == '') {
        var fieldsaround = 0;
        for (var i = x - 1; i < x + 1; i++) {
          for (var j = y - 1; j < y + 1; j++) {
            if (f[x][y] == '')
              fieldsaround++;
          }
        }
        if (fieldsaround < 7) {
          f[x][y] = swamp;
        }
      }
    }
  }
  return f;
}

http.createServer(function (req, res) {
  switch (req.url) {
  case '/':
    res.writeHead(200);
    res.end(fs.readFileSync('index.html', 'utf-8'));
    break;
  case '/d3.min.js':
    res.writeHead(200);
    res.end(fs.readFileSync('d3.min.js', 'utf-8'));
    break;
  case '/field':
    res.writeHead(200);
    res.end(JSON.stringify(state));
    break;
  case '/state':
  default:
    res.writeHead(404);
    res.end("page not found");
  }
  console.log(req.url);
  res.writeHead(200);
  res.end("test");
}).listen(9024, "127.0.0.1");