# query-once
Multiple times the same GET request, just query once

## How to install

	npm i --save query-once

## Usage


### server.js

```javascript
var express = require('express');
var queryOnce = require('query-once');
var app = express();

function result(data) {
    //this === res
    this.send(data);
}

app.get('/', queryOnce.register(result), function (req, res) {
    if (queryOnce.isComplete(req)) {
        console.log('>>>>>>' + 'only once');
        setTimeout(function () {
            var data = {"query": "once"};
            queryOnce.success(req, data);
        }, 2000)
    }
});

app.listen(3000);
```
### request.js

```javascript
var http = require('http');
for (var i = 0; i < 5; i++) {
    (function (i) {
        console.time('time:' + i);
        http.get('http://localhost:3000?a=a&b=b', function (res) {
            if (res.statusCode === 200) {
                var rawData = '';
                res.on('data', function (chunk) {
                    rawData += chunk
                });
                res.on('end', function () {
                    console.timeEnd('time:' + i);
                    console.log(rawData);
                });
            } else {
                res.resume();
            }
        }).on('error', function (e) {
            console.log("Got error:" + e.message);
        });
    })(i)
}

```
