  let rawData = [];
  let xAxis;

    document.getElementById("csvFileInput").addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          rawData = results.data;
          updateCharts();
          drawMap();
        },
      });
    });

    document.getElementById("xAxisSelector").addEventListener("change", () => {
      updateCharts();
    });

    function formatXAxis(row) {
      const selector = document.getElementById("xAxisSelector").value;
      if (selector === "time") {
        xAxis = "Time";
        return `${row.hour.padStart(2, "0")}:${row.minute.padStart(2, "0")}`;
      } else if (selector === "location") {
        xAxis = "Location";
        return `${row.lat},${row.long}`;
      } else if (selector === "alt") {
        xAxis = "Altitude";
        return row.alt;
      }
    }

    let h2sCoChart, humidityTempChart, cpmNsvChart;

    function updateCharts() {
      const labels = rawData.map(formatXAxis);
      const h2s = rawData.map((row) => parseFloat(row.h2sppm));
      const co = rawData.map((row) => parseFloat(row.coppm));
      const humidity = rawData.map((row) => parseFloat(row.humidity));
      const temp = rawData.map((row) => parseFloat(row.temperature));
      const cpm = rawData.map((row) => parseFloat(row.cpm));
      const nsv = rawData.map((row) => parseFloat(row.nSv));

      if (h2sCoChart) h2sCoChart.destroy();
      if (humidityTempChart) humidityTempChart.destroy();
      if (cpmNsvChart) cpmNsvChart.destroy();

  h2sCoChart = new Chart(document.getElementById("h2sCoChart"), {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "H2S PPM",
        data: h2s,
        borderColor: "#f39c12",
        backgroundColor: "rgba(243, 156, 18, 0.3)", // semi-transparent orange
        fill: true,
      },
      {
        label: "CO PPM",
        data: co,
        borderColor: "#3498db",
        backgroundColor: "rgba(52, 152, 219, 0.3)", // semi-transparent blue
        fill: true,
      },
    ],
  },
  options: {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: xAxis,
        },
      },
    },
  },
});

      humidityTempChart = new Chart(document.getElementById("humidityTempChart"), {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Humidity (%)",
              data: humidity,
              borderColor: "#2ecc71",
              yAxisID: "y1",
              fill: false,
            },
            {
              label: "Temperature (°C)",
              data: temp,
              borderColor: "#e74c3c",
              yAxisID: "y2",
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: { title: { display: true, text: xAxis } },
            y1: {
              type: "linear",
              position: "left",
              title: { display: true, text: "Humidity" },
            },
            y2: {
              type: "linear",
              position: "right",
              title: { display: true, text: "Temperature" },
              grid: { drawOnChartArea: false },
            },
          },
        },
      });

      cpmNsvChart = new Chart(document.getElementById("cpmNsvChart"), {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "CPM",
              data: cpm,
              borderColor: "#8e44ad",
              yAxisID: "y1",
              fill: false,
            },
            {
              label: "nSv",
              data: nsv,
              borderColor: "#16a085",
              yAxisID: "y2",
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: { title: { display: true, text: xAxis } },
            y1: {
              type: "linear",
              position: "left",
              title: { display: true, text: "CPM" },
            },
            y2: {
              type: "linear",
              position: "right",
              title: { display: true, text: "nSv" },
              grid: { drawOnChartArea: false },
            },
          },
        },
      });
    }

function drawMap() {
  document.getElementById("map").innerHTML = ""; // reset

  const map = L.map("map");

  // Base layer
  const baseLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  const bounds = [];
  const markerLayer = L.layerGroup(); // for individual circle markers
  const pathLayer = L.layerGroup(); // for the path polyline

  rawData.forEach((row) => {
    const lat = parseFloat(row.lat);
    const lon = parseFloat(row.long);
    const cpm = parseFloat(row.cpm);

    if (!isNaN(lat) && !isNaN(lon)) {
      const color = cpm > 100 ? "red" : cpm > 50 ? "orange" : "green";

      const circle = L.circleMarker([lat, lon], {
        radius: 8,
        color,
        fillOpacity: 0.6,
      });

      circle.bindPopup(`CPM: ${cpm}<br>Location: ${lat}, ${lon}`);
      circle.addTo(markerLayer);

      bounds.push([lat, lon]);
    }
  });

  if (bounds.length > 0) {
    // Path
    const path = L.polyline(bounds, { color: "blue" }).addTo(pathLayer);

    // Start marker
    const startMarker = L.marker(bounds[0], {
      title: "Start",
    }).bindPopup("Start Point").addTo(pathLayer);

    // Stop marker
    const stopMarker = L.marker(bounds[bounds.length - 1], {
      title: "Stop",
    }).bindPopup("Stop Point").addTo(pathLayer);

    // Add all to map
    markerLayer.addTo(map);
    pathLayer.addTo(map);

    // Layer control (top left)
    L.control
      .layers(null, {
        "Sensor Markers": markerLayer,
        "Travel Path": pathLayer,
      }, { position: "topleft" })
      .addTo(map);

    map.fitBounds(path.getBounds(), { maxZoom: 7 });
  } else {
    map.setView([20.59, 78.96], 5);
  }
}




// document.getElementById("csvFile").addEventListener("change", function (e) {
//     const file = e.target.files[0];
//     if (file) {
//       Papa.parse(file, {
//         header: true,
//         skipEmptyLines: true,
//         complete: function (results) {
//           const data = results.data;
//           visualize(data);
//         }
//       });
//     }
//   });
  
//   function visualize(data) {
//     const time = [];
//     const cpm = [], h2s = [], co = [], temp = [], hum = [];
//     const latLngs = [];
//     let latest = {};
  
//     data.forEach(row => {
//       const timestamp = `${row.year}-${row.month}-${row.day} ${row.hour}:${row.minute}`;
//       time.push(timestamp);
//       cpm.push(+row.cpm);
//       h2s.push(+row.h2sppm);
//       co.push(+row.coppm);
//       temp.push(+row.temperature);
//       hum.push(+row.humidity);
  
//       latLngs.push([
//         +row.lat, +row.long, +row.h2sppm // For heatmap
//       ]);
  
//       latest = row; // last row for gauges
//     });

//     // Line Charts
//     drawLine("lineCPM", time, cpm, "CPM");
//     drawLine("lineH2S", time, h2s, "H₂S (PPM)");
//     drawLine("lineCO", time, co, "CO (PPM)");
//     drawDualLine("lineTempHumidity", time, temp, hum, "Temp", "Humidity");
  
//     // Map
//     const map = L.map("map").setView([+latest.lat, +latest.long], 13);
//     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//       attribution: "© OpenStreetMap contributors"
//     }).addTo(map);
  
//     // Marker
//     data.forEach(row => {
//       const marker = L.circleMarker([+row.lat, +row.long], {
//         radius: 6,
//         fillColor: getColor(+row.h2sppm),
//         fillOpacity: 0.8,
//         color: "#000",
//         weight: 1
//       }).addTo(map).bindPopup(
//         `H₂S: ${row.h2sppm} PPM<br>CO: ${row.coppm} PPM<br>CPM: ${row.cpm}`
//       );
//     });
  
//     // Heatmap toggle
//     const heat = L.heatLayer(latLngs, { radius: 25 }).addTo(map);
//   }
  
//   function drawLine(id, labels, values, label) {
//     const ctx = document.getElementById(id).getContext("2d");
//     new Chart(ctx, {
//       type: "line",
//       data: {
//         labels,
//         datasets: [{
//           label,
//           data: values,
//           fill: false,
//           borderColor: "blue",
//           tension: 0.1
//         }]
//       }
//     });
//   }
  
//   function drawDualLine(id, labels, temp, hum, label1, label2) {
//     const ctx = document.getElementById(id).getContext("2d");
//     new Chart(ctx, {
//       type: "line",
//       data: {
//         labels,
//         datasets: [
//           {
//             label: label1,
//             data: temp,
//             borderColor: "red",
//             yAxisID: 'y1'
//           },
//           {
//             label: label2,
//             data: hum,
//             borderColor: "green",
//             yAxisID: 'y2'
//           }
//         ]
//       },
//       options: {
//         scales: {
//           y1: { position: 'left', title: { display: true, text: label1 } },
//           y2: { position: 'right', title: { display: true, text: label2 } }
//         }
//       }
//     });
//   }
  
//   function getColor(value) {
//     if (value > 100) return "red";
//     if (value > 50) return "orange";
//     return "green";
//   }
  