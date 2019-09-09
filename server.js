const http  = require('http');
const fs    = require('fs');
const { exec } = require('child_process');


// Reading the file that has to be displayed
fs.readFile('./deck.html', function(err, data) {
    if (err){
        throw err;
    }
    htmlFile = data;
});

/*
fs.readFile('./style.css', function(err, data) {
    if (err){
        throw err;
    }
    cssFile = data;
});


fs.readFile('./upload.js', function(err, data) {
    if (err){
        throw err;
    }
    javascriptFile = data;
});
*/

// Server creation
var server = http.createServer(function(req, res) {

  // GET methode -> User wants something (html, css, etc..)
    if(req.method === "GET") {
        // Serves different pages depending on what whants the client
        switch (req.url) {
            case "/upload.js" :
                res.writeHead(200, {"Content-Type": "application/js"});
                res.write(javascriptFile);
                res.end();
                break;
            case "/styles.css" :
                res.writeHead(200, {"Content-Type": "text/css"});
                res.write(cssFile);
                res.end();
                break;
            case "/" :
                res.writeHead(200, {"Content-Type": "text/html"});
                res.write(htmlFile);
                res.end();
                break;
            default :
                break;
    }
    // POST METHOD when user want to send something
    } else if(req.method === "POST") {
        if(req.url == "/lcd_backlight_off"){
            console.log('toggle off');
            // Turn display off
            toggleDisplayBacklight('0');
        }
        else if(req.url == "/lcd_backlight_on"){
            console.log('toggle on');
            // Turn display on
            toggleDisplayBacklight('1');
        }
        res.writeHead(200);
        res.end();
    }
});
server.listen(8081);

function toggleDisplayBacklight(state){
    exec('vcgencmd display_power ' + String(state), (err, stdout, stderr) => {
        if (err) {
          // node couldn't execute the command
          return;
        }
      
        // the *entire* stdout and stderr (buffered)
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
      });
}

console.log('Server running at http://localhost:8081/');
