const div = document.getElementById('inner-circle');

// Function to toggle fullscreen
function toggleFullscreen() {
  if (
    document.fullscreenElement || 
    document.webkitFullscreenElement || 
    document.mozFullScreenElement || 
    document.msFullscreenElement
  ) {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  } else {
    // Enter fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  }
}

// Handle double-click (desktop)
div.addEventListener('dblclick', toggleFullscreen);

// Handle double-tap (touchscreen)
let lastTap = 0;
div.addEventListener('touchend', function (e) {
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;

  if (tapLength > 0 && tapLength < 300) {
    toggleFullscreen();
    e.preventDefault(); // prevent ghost clicks
  }

  lastTap = currentTime;
});

// Optional: handle Enter or Space for accessibility
div.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    toggleFullscreen();
  }
});

function usersLocationUpdated() { }
// function heatMapUpdated() { }
// function dataForHeatmap() { }
// function heatmap() { }
const outerCircle = document.getElementById('outer-circle');
const innerCircle = document.getElementById('inner-circle');
const speedValue = document.getElementById('speed-value');
const directionValue = document.getElementById('direction-value');

let isDragging = false;

innerCircle.addEventListener('mousedown', startDrag);
innerCircle.addEventListener('touchstart', startDrag);

function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
}

function drag(e) {
    if (isDragging) {
        const outerCircleRect = outerCircle.getBoundingClientRect();
        const innerCircleRect = innerCircle.getBoundingClientRect();

        const x = e.clientX || e.touches[0].clientX;
        const y = e.clientY || e.touches[0].clientY;

        // Calculate the distance from the cursor to the center of the outer circle
        const dx = x - outerCircleRect.x - outerCircleRect.width / 2;
        const dy = y - outerCircleRect.y - outerCircleRect.height / 2;

        // Convert Cartesian coordinates to polar coordinates
        const radius = Math.sqrt(dx ** 2 + dy ** 2);
        const angle = Math.atan2(dy, dx);

        // Ensure the inner circle stays within the bounds of the outer circle
        const maxRadius = outerCircleRect.width / 2 - innerCircleRect.width / 2;
        const clampedRadius = Math.min(radius, maxRadius);

        // Convert back to Cartesian coordinates
        const newX = clampedRadius * Math.cos(angle) - innerCircleRect.width / 70;
        const newY = clampedRadius * Math.sin(angle) - innerCircleRect.height / 70;

        innerCircle.style.transform = `translate(${newX}px, ${newY}px)`;

        // Update speed value based on distance
        const distancePercentage = (clampedRadius / maxRadius) * 100;
        const speed = Math.round(distancePercentage);
        // console.log("Speed Value" + speed);

        data.speedValue = speed;
        speedValue.textContent = speed;
        const jsonData = JSON.stringify(data);
        socket.send(jsonData);

        // if(drag){
        //     data.speedValue = speed;
        //     const jsonData = JSON.stringify(data);
        //     socket.send(jsonData);

        //     speedValue.textContent = "S1";
        // }
        // else if(stopDrag){
        //     data.speedValue = 0;
        //     const jsonData = JSON.stringify(data);
        //     socket.send(jsonData);

        //     speedValue.textContent = "S2";
        // }


        // Update direction text
        updateDirectionText(angle);
    }
}

function stopDrag() {
    isDragging = false;
    innerCircle.style.transform = 'translate(0%, 0%)';
    speedValue.textContent = '0';

    // data.speedValue = 0;
    // const jsonData = JSON.stringify(data);
    // socket.send(jsonData);

    updateDirectionText(0);
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
}

function updateDirectionText(angle) {
    // const threshold = 0.22; // Adjust the threshold as needed
    
    if (angle == 0) {
        directionValue.textContent = 'STOP';
        data.direction = "stop";
        data.speedValue = 100;
        const jsonData = JSON.stringify(data);
        socket.send(jsonData);
    } else if (angle >= -2.25 && angle <= -0.75) {
        directionValue.textContent = 'Forward';
        data.direction = "forward";
        // console.log("This is socket "+data.direction);

        const jsonData = JSON.stringify(data);
        socket.send(jsonData);

    } else if (angle <= 2.25 && angle >= 0.75) {
        directionValue.textContent = 'Reverse';
        data.direction = "reverse";

        const jsonData = JSON.stringify(data);
        socket.send(jsonData);
        // console.log("This is socket "+data.direction);

    } else if (angle < -2.25 || angle >= 2.25) {
        directionValue.textContent = 'Left';
        data.direction = "left";
        // console.log("This is socket "+data.direction);

        const jsonData = JSON.stringify(data);
        socket.send(jsonData);


    } else {
        directionValue.textContent = 'Right';
        data.direction = "right";

        const jsonData = JSON.stringify(data);
        socket.send(jsonData);
        // console.log("This is socket "+data.direction);

    }
}

const socket = new WebSocket('https://bedford-cyber-insured-rooms.trycloudflare.com/control');
// const socket = new WebSocket('wss://10.249.1.125:1880/control');
//const socket = new WebSocket('wss://192.168.205.242:1880/control');
// DATA FORMAT TO SEND TO NODE FOR CONTROLLING WHEEL
const data = {
    speedValue: 0,
    direction: ""
};
// SENDIG CONTROLLER DATAS TO THE NODE-RED

var sensorData = [];
// Initialize an empty array to store heatmap data
var heatmapData = [];

// Initialize the map object
var map;


function updateTimeEveryOneMinute() {
    function getCurrentTime12HourFormat() {
        var now = new Date();
        var hours = now.getHours();
        var minutes = now.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12;

        minutes = minutes < 10 ? '0' + minutes : minutes;

        var timeString = hours + ':' + minutes + ' ' + ampm;
        return timeString;
    }
    var currentTime = getCurrentTime12HourFormat();
    document.getElementById("time-value").innerHTML = currentTime;
}

setInterval(updateTimeEveryOneMinute, 1000);

// const socket = new WebSocket('ws:127.0.0.1:1880/ws/data');
let lastCallTime = 0;

// Event listener for button click
document.getElementById('front-direction').addEventListener('click', function () {
    // Data to send
    const data = {
        message: 'Hello, Node-RED!'
        // Add more data properties as needed
    };

    // Convert data to JSON
    const jsonData = JSON.stringify(data);

    // Send data over the WebSocket connection
    socket.send(jsonData);
});

//LATITUDE AND LONGITUDE FOR HEAD MAP
var latitudeForHeatMap;
var longitudeForHeatMap;
var sensorData = [];
socket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    // console.log("data: ", data);

    if (data.temperature !== undefined) {
        document.getElementById('temperature-value').textContent = data.temperature + ' °C';
    }
    if (data.humidity !== undefined) {
        document.getElementById('humidity-value').textContent = data.humidity + '%';
    }
    if (data.nSv !== undefined) {
        document.getElementById('radiantion-value').textContent = data.nSv + 'bq';
    }
    if (data.coppm !== undefined) {
        document.getElementById('CO-value').textContent = data.coppm + 'ppm';
    }
    if (data.h2sppm !== undefined) {
        document.getElementById('h2s-value').textContent = data.h2sppm + 'ppm';
    }
    if (data.humidity !== undefined) {
        document.getElementById('altitude-value').textContent = data.humidity + 'm';
    }
    if (data.lat !== undefined) {
        document.getElementById('latitude-value').textContent = data.lat + '°';
    }
    if (data.long !== undefined) {
        document.getElementById('longitude-value').textContent = data.long + '°';
    }
    if (data.lat !== undefined && data.long !== undefined && data.nSv !== undefined) {
        // Update the HTML elements with latitude, longitude, and radiation data
        document.getElementById('latitude-value').textContent = data.lat + '°';
        document.getElementById('longitude-value').textContent = data.long + '°';

        // Call the function to update the heatmap data
        heatmapdata(data.lat, data.long, data.nSv);
    }
    usersLocationUpdated({ coords: { latitude: data.lat, longitude: data.long } });
};

// console.log("lat for hm " + latitudeForHeatMap)
socket.onerror = function (error) {
    console.error('WebSocket Error: ', error);
};

socket.onclose = function (event) {
    if (event.wasClean) {
        console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
    } else {
        console.error('Connection died');
    }
};

// function initializeMaps() {
//     GetMap();
//     GetHeatMap();
// }

//var map, heatMap, watchId, userPin;

var map1; // Declare a global variable for the map
var map2;
var heatmapLayer; // Declare a global variable for the heatmap layer
var heatmapData = []; // Declare a global variable for heatmap data

function GetMap() {
    map1 = new Microsoft.Maps.Map('#map', {
        credentials: bingKey,
        mapTypeId: Microsoft.Maps.MapTypeId.aerial,
        center: new Microsoft.Maps.Location(0, 0),
        zoom: 14
    });

    // Add a pushpin to show the user's location.
    userPin = new Microsoft.Maps.Pushpin(map1.getCenter(), { visible: false });
    map1.entities.push(userPin);

    // Watch the users location.
    // watchId = navigator.geolocation.watchPosition(usersLocationUpdated);

    // usersLocationUpdated({ coords: { latitude: lat, longitude: long } });
}
function usersLocationUpdated(position) {
    var loc = new Microsoft.Maps.Location(
        position.coords.latitude,
        position.coords.longitude);

    // Update the user pushpin.
    userPin.setLocation(loc);
    userPin.setOptions({ visible: true });

    // Center the map on the user's location.
    map1.setView({ center: loc, zoom: map1.getZoom() });

}

function GetHeatMap() {
    map2 = new Microsoft.Maps.Map('#heatMap', {
        credentials: bingKey,
        mapTypeId: Microsoft.Maps.MapTypeId.aerial,
        center: new Microsoft.Maps.Location(0, 0),
        zoom: 17
    });

    // Load the HeatMap module.
    Microsoft.Maps.loadModule('Microsoft.Maps.HeatMap', function () {
        // Create the initial heatmap layer with empty data
        heatmapLayer = new Microsoft.Maps.HeatMapLayer([], {
            intensity: 0.65,
            radius: 20,
            unit: 'meters',
            colorGradient: {
                '0': 'Black',
                '0.2': 'Purple',
                '0.4': 'yellow',
                '0.7': 'red',
            }
        });

        // Insert the heatmap layer to the map
        map2.layers.insert(heatmapLayer);

        // Allow the heatmapdata function to be called after the Bing Maps API is loaded
        window.heatmapdata = heatmapdata;
    });
}

function heatmapdata(latitude, longitude, radiation) {
    // Add the new data to the heatmapData array
    heatmapData.push(new Microsoft.Maps.Location(latitude, longitude, radiation));

    // Update the heatmap with the new data
    if (heatmapLayer) {
        heatmapLayer.setLocations(heatmapData);
    }

    // Center the map on the latest latitude and longitude
    if (map2) {
        map2.setView({
            center: new Microsoft.Maps.Location(latitude, longitude),
            zoom: map2.getZoom()
        });
    }
}




// ======================================
// LATENCY CSV LOGGER (SEPARATE SOCKET)
// ======================================

// Use a SEPARATE WebSocket for latency
const LATENCY_WS = 'wss:bedford-cyber-insured-rooms.trycloudflare.com/latency';
console.log("Latency");

let latencySocket = null;
let latencyData = [];
let latencyTimer = null;

// How long to run test
const TEST_DURATION = 10000; // 10 seconds
const SEND_INTERVAL = 1000;  // 1 second

function convertNodeTimestamp(t) {
    return t - performance.timing.navigationStart;
}

function startLatencyTest() {

    latencyData = [];
    latencySocket = new WebSocket(LATENCY_WS);

    latencySocket.onopen = () => {
        console.log("Latency socket open");

        latencyTimer = setInterval(() => {
            let now = performance.now();
            latencySocket.send(JSON.stringify({
                client_send_time: now,
                latency_test: true
            }));
        }, SEND_INTERVAL);
    };

    latencySocket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Ignore non-latency messages
        if (!data.latency_test) return;

        let t0 = data.client_send_time;
        let t1 = convertNodeTimestamp(data.node_received_time);
        let t2 = performance.now();

        latencyData.push({
            upload: (t1 - t0).toFixed(3),
            download: (t2 - t1).toFixed(3),
            rtt: (t2 - t0).toFixed(3)
        });
    };

    setTimeout(stopLatencyTest, TEST_DURATION);
}

function stopLatencyTest() {
    clearInterval(latencyTimer);
    if (latencySocket) latencySocket.close();
    downloadLatencyCSV();
}

function downloadLatencyCSV() {
    let csv = "upload_ms,download_ms,rtt_ms\n";

    latencyData.forEach(row => {
        csv += `${row.upload},${row.download},${row.rtt}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "latency_results.csv";
    a.click();
    URL.revokeObjectURL(url);

    console.log("Latency CSV downloaded:", latencyData.length, "rows");
}

startLatencyTest();
