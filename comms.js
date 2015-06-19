var http = require('http');
var fs = require('fs');
var url = require('url');


var state = {
  "field": createField('r', 'b', 's'),
  "r": 0,
  "b": 0,
  "conns": []
}

function createField(player1, player2, swamp) {
  var f = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''].map(function (o, x) {
    return ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''].map(function (p, y) {
      if ((x == 0 && y == 0) || (x == 0 && y == 23) || (x == 23 && y == 0) || (x == 23 && y == 23)) {
        return swamp;
      }
      if (x == 0 || x == 23)
        return 'z' + player1;
      if (y == 0 || y == 23)
        return 'z' + player2;
      return '';
    });
  });
  for (var x = 1; x < 23; x++) {
    for (var y = 1; y < 23; y++) {
      if (Math.random() > 0.85 && f[x][y] == '') {
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

function set(state, x, y, colour) {
  if ((state.field[x][y] == "") || (state.field[x][y] == "zr" && colour == "r") || (state.field[x][y] == "zb" && colour == "b")) {
    state.field[x][y] = colour;
  }

  var positions = [[-1, -2], [1, -2], [2, 1], [2, -1], [1, 2], [-1, 2], [-2, -1], [-2, 1]];

  var intersects = function (x1, y1, x2, y2, x3, y3, x4, y4) {
    return ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) * ((x4 - x1) * (y2 - y1) - (y4 - y1) * (x2 - x1)) < 0 &&
      ((x1 - x3) * (y4 - y3) - (y1 - y3) * (x4 - x3)) * ((x2 - x3) * (y4 - y3) - (y2 - y3) * (x4 - x3)) < 0;
  };

  for (var i = 0; i < positions.length; i++) {
    var rx = positions[i][0];
    var ry = positions[i][1];
    console.log('rx:' + rx + ' ry:' + ry);
    if (!(rx == 0 && ry == 0) && (x + rx >= 0) && (y + ry >= 0) && (x + rx < 24) && (y + ry < 24)) {
      if (state.field[x + rx][y + ry] == colour || state.field[x + rx][y + ry] == ('z' + colour)) {
        var intersectionFound = false;
        for (var conn in state.conns) {
          if (intersects(x, y, x + rx, y + ry, conn.x1, conn.y1, conn.x2, conn.y2)) {
            console.log('line intersects');
            intersectionFound = true;
            break;
          }
        }
        if (!intersectionFound) {
          state.conns.push({
            "x1": x,
            "y1": y,
            "x2": x + rx,
            "y2": y + ry,
            "colour": colour
          });
          return state;
        }
      }
    }
  }
  return state;
}

http.createServer(function (req, res) {
  var requrl = url.parse(req.url, true);
  switch (requrl.pathname) {
  case '/':
    res.writeHead(200);
    res.end(fs.readFileSync('index.html', 'utf-8'));
    break;
  case '/d3.min.js':
    res.writeHead(200, {
      'Content-Type': 'application/javascript'
    });
    res.end(fs.readFileSync('d3.min.js', 'utf-8'));
    break;
  case '/state':
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify(state));
    break;
  case '/set':
    if (requrl.query.x && requrl.query.y && requrl.query.colour) {
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      state = set(state, parseInt(requrl.query.x), parseInt(requrl.query.y), requrl.query.colour);
      res.end(JSON.stringify(state));
    } else {
      res.writeHead(400);
      res.end('Bad request! Needs x and y as integer and colour as string arguments.');
    }
    break;
  default:
    res.writeHead(404);
    res.end("page not found");
  }
  console.log(req.url);
}).listen(9024, "127.0.0.1");