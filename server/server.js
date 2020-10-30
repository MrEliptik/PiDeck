const http  = require('http');
const fs    = require('fs');
const { exec } = require('child_process');
var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi();

fs.readFile("server/deck/favicon.png", function(err, data) {
  if (err){
    throw err;
  }
  faviconFile = data;
});

// Reading the file that has to be displayed
fs.readFile('server/deck/deck.html', function(err, data) {
    if (err){
        throw err;
    }
    htmlFile = data;
});

fs.readFile("server/min_config.json", function(err, data) {
    if (err){
        throw err;
    }
    configFile = JSON.parse(data);
    html = createHTML(configFile);
    console.log('Config file read succesfully!')
});

fs.readFile("server/admin/admin.html", function(err, data) {
  if (err){
    throw err;
  }
  adminFile = data;
});

fs.readFile("server/admin/assets/pideck_banner.png", function(err, data) {
  if (err){
    throw err;
  }
  bannerFile = data;
});

// Server creation
var server = http.createServer(function(req, res) {

  // GET method -> User wants something (html, css, etc..)
    if(req.method === "GET") {
        console.log(req.url);
        // Serves different pages depending on what wants the client
        switch (req.url) {
            case "/favicon.png":
                // MIME type of your favicon.
                //
                // .ico = 'image/x-icon' or 'image/vnd.microsoft.icon'
                // .png = 'image/png'
                // .jpg = 'image/jpeg'
                // .jpeg = 'image/jpeg'
                res.setHeader('Content-Type', 'image/png');

                // Serve your favicon and finish response.
                res.write(faviconFile);
                res.end();
                break;
            case "/min_config.json":
                res.writeHead(200, {"Content-Type": "application/json"});
                res.write(JSON.stringify(configFile));
                res.end();
                break;
            case "/assets/pideck_banner.png":
                res.writeHead(200, {'Content-Type': 'image/png'});
                // Serve your favicon and finish response.
                res.write(bannerFile);
                res.end();
              break;
            case "/admin":
                res.writeHead(200, {"Content-Type": "text/html"});
                res.write(adminFile);
                res.end();
                break;
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
                res.write(html);
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

function createHTML(json_config){
    cells_html = '';
    cells_css = '';
    js = '';
    for(var i = 0; i < json_config.grid.cells.length; i++){
      cells_html += `<div class="cell" id="cell_${i}">
          <div class"icon">${json_config.grid.cells[i].icon}</div>`;
      if(json_config.grid.cells[i].text != ""){
        cells_html += `<div class="text">${json_config.grid.cells[i].text}</div>`;
      }
      cells_html += '</div>';
          
      cells_css += `#cell_${i}{
          background-color:${json_config.grid.cells[i]['background-color']};
          color:${json_config.grid.cells[i]['icon-color']};
        }`;
        js += `var cell_${i}_toggled = false;`
      js += `document.getElementById('cell_${i}').addEventListener('touchend', () =>{ \n`;
      if(json_config.grid.cells[i]['toggled-icon']){
        js += `
          if(cell_${i}_toggled){
            cell_${i}_toggled = false;
            document.getElementById('cell_${i}').firstElementChild.innerHTML = "${json_config.grid.cells[i]['icon']}";
          }
          else{
            cell_${i}_toggled = true;
            document.getElementById('cell_${i}').firstElementChild.innerHTML = "${json_config.grid.cells[i]['toggled-icon']}";
          }\n`;  
      }
      //console.log(json_config.grid.cells[i]['action-url']);
      if(json_config.grid.cells[i]['action-url']){
        js += `sendHTTPrequest("${json_config.grid.cells[i]['action-url']}"); \n`;
      }
      js += `}); \n`;
    }
    html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>PiDeck</title>
        <style>
          body,
          html {
            margin: 0;
            padding: 0;
            cursor: url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7),
              auto;
            height: ${json_config.height}px;
            width: ${json_config.width}px;
          }

          .text{
            /*font-size: calc(1em + 1vw);*/
          }
    
          .grid {
            width: 100vw;
            height: 100vh;
            display: grid;
            font-size: calc(2em + 1vw); 
            text-align: center;
            grid-template-columns: repeat(auto-fit, minmax(${json_config.width/json_config.grid.columns}px, 1fr));
            /*grid-template-columns: repeat(${json_config.grid.columns}, minmax(0, 1fr));*/
            /*grid-auto-rows: 1fr;*/
            grid-template-rows: repeat(auto-fit, minmax(${json_config.height/json_config.grid.rows}px, 1fr));
          }

          ${cells_css}
    
          /* Just to make the grid visible */
          .grid > * {
            display: grid;
            justify-content: center;
            align-items: center;
            border: 1px grey solid;
          }
        </style>
        <script src="https://kit.fontawesome.com/9a5860ea71.js"></script>
      </head>
    
      <body>
        <!--
        <div>
          <iframe
            src="https://calendar.google.com/calendar/embed?height=480&amp;wkst=1&amp;bgcolor=%23525252&amp;ctz=Europe%2FParis&amp;src=dmljdG9yLm1ldW5pZXJwa0BnbWFpbC5jb20&amp;src=YWRkcmVzc2Jvb2sjY29udGFjdHNAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&amp;src=ZnIuZnJlbmNoI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&amp;color=%237CB342&amp;color=%23D50000&amp;color=%23009688&amp;showTitle=0&amp;mode=WEEK&amp;showPrint=0&amp;showTabs=1&amp;showCalendars=1&amp;showTz=1"
            style="border-width:0"
            width="800"
            height="480"
            frameborder="0"
            scrolling="no"
          ></iframe>
        </div>
      -->
        <div class="grid">
          ${cells_html}
        </div>
      </body>
    
      <script>
        var lcdState = "1";
    
        ${js}

        /*
        var cells = document.querySelectorAll(".cell");
        cells.forEach(cell => {
          cell.addEventListener("touchend", e => {
            e.preventDefault();
    
            if (lcdState == "0") {
              sendHTTPrequest("lcd_backlight_on");
              //TODO: handle error
              lcdState = "1";
              return;
            }
    
            
            console.log(e.currentTarget.id);
            if (e.currentTarget.id == "cell_1") {
              document.getElementById("cell_1").innerHTML =
                '<i class="fas fa-lightbulb"></i>';
              sendHTTPrequest("lcd_backlight_off");
              // TODO: handle error
              lcdState = "0";
            } else if (e.currentTarget.id == "cell_2") {
            } else if (e.currentTarget.id == "cell_3") {
            } else if (e.currentTarget.id == "cell_4") {
            } else if (e.currentTarget.id == "cell_5") {
            } else if (e.currentTarget.id == "cell_6") {
            }
          });
        });
        */
    
        function sendHTTPrequest(url) {
          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
              console.log(this.responseText);
            }
          };
          xhr.open("POST", "http://localhost:8081/" + url, true);
          console.log(xhr);
          xhr.send();
        }
      </script>
    </html>
    `
    return html;
}

console.log('Server running at http://localhost:8081/');
