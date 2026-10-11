// District Explorer - Lab 2, Web GIS (IGIS, NUST)
// Kinza Naeem, roll 538218

// ---------------------------------------------------------------
// Part 5: create the map and keep the view on Pakistan
// Pakistan spans about 23.6 to 37.1 N and 60.9 to 77.9 E.
// The limits add about two degrees so border districts are not
// pressed against the edge of the window.
// ---------------------------------------------------------------
const pakistanLimits = L.latLngBounds([21.5, 58.5], [39.0, 80.5]);

const map = L.map('map', {
  maxBounds: pakistanLimits,
  maxBoundsViscosity: 1.0,
  minZoom: 5
}).setView([30.3753, 69.3451], 5);

const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Extra 1: a second basemap and a control to switch between them
const light = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  });

L.control.layers(
  { 'OpenStreetMap': osm, 'Light (CARTO)': light },
  null,
  { position: 'topright' }
).addTo(map);

// ---------------------------------------------------------------
// Part 7: classification and popup helpers
// ---------------------------------------------------------------
function show(value) {
  if (value === null || value === undefined || value === '') {
    return 'not recorded';
  }
  return typeof value === 'number' ? value.toLocaleString() : value;
}

function colourFor(population) {
  if (population === null || population === undefined) return '#c9cfd1';
  if (population > 3000000) return '#7f2704';
  if (population > 1500000) return '#d94801';
  if (population >  750000) return '#f16913';
  if (population >  300000) return '#fd8d3c';
  return '#fdd0a2';
}

function styleFor(feature) {
  return {
    color: '#ffffff',
    weight: 1,
    fillColor: colourFor(feature.properties.pop_2023),
    fillOpacity: 0.8
  };
}

// ---------------------------------------------------------------
// Part 6: draw the layer
// ---------------------------------------------------------------
let layer = null;

function draw(features) {
  if (layer) {
    map.removeLayer(layer);
  }

  layer = L.geoJSON(
    { type: 'FeatureCollection', features: features },
    {
      style: styleFor,
      onEachFeature: function (feature, featureLayer) {
        const p = feature.properties;
        featureLayer.bindPopup(
          '<strong>' + show(p.district) + '</strong><br>' +
          'Province: ' + show(p.province) + '<br>' +
          'Population: ' + show(p.pop_2023) + '<br>' +
          'Area: ' + show(p.area_km2) + ' km<sup>2</sup>'
        );

        // Extra 2: highlight a district on mouseover
        featureLayer.on('mouseover', function () {
          this.setStyle({ weight: 3, color: '#23373b' });
          this.bringToFront();
        });
        featureLayer.on('mouseout', function () {
          layer.resetStyle(this);
        });
      }
    }
  ).addTo(map);

  if (features.length > 0) {
    map.fitBounds(layer.getBounds());
  }

  document.getElementById('count').textContent =
    features.length + ' districts';
}

// ---------------------------------------------------------------
// Part 8: fill the drop-down from the data
// ---------------------------------------------------------------
function fillProvinceList() {
  const select = document.getElementById('province');

  const provinces = [...new Set(
    districts.features.map(f => f.properties.province)
  )].sort();

  for (const name of provinces) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }
}

// ---------------------------------------------------------------
// Part 8: react to the user
// The province drop-down and the name box (Extra 3) work together:
// both filters are applied every time either one changes.
// ---------------------------------------------------------------
function applyFilters() {
  if (!districts) return;

  const chosen = document.getElementById('province').value;
  const typed = document.getElementById('search').value.trim().toLowerCase();

  const subset = districts.features.filter(f => {
    const p = f.properties;
    const provinceOk = chosen === 'all' || p.province === chosen;
    const nameOk = typed === '' ||
      String(p.district).toLowerCase().includes(typed);
    return provinceOk && nameOk;
  });

  draw(subset);
}

document.getElementById('province')
  .addEventListener('change', applyFilters);

document.getElementById('search')
  .addEventListener('input', applyFilters);

// ---------------------------------------------------------------
// Part 7: legend
// ---------------------------------------------------------------
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend');
  const breaks = [0, 300000, 750000, 1500000, 3000000];
  const labels = ['under 300k', '300k to 750k', '750k to 1.5m',
                  '1.5m to 3m', 'over 3m'];

  for (let i = 0; i < breaks.length; i++) {
    div.innerHTML +=
      '<i style="background:' + colourFor(breaks[i] + 1) + '"></i> ' +
      labels[i] + '<br>';
  }
  div.innerHTML +=
    '<i style="background:' + colourFor(null) + '"></i> no census data';
  return div;
};

legend.addTo(map);

// ---------------------------------------------------------------
// Part 5: fetch the data
// ---------------------------------------------------------------
let districts = null;

async function loadData() {
  const response = await fetch('data/districts.geojson');

  if (!response.ok) {
    console.error('Request failed with status', response.status);
    return;
  }

  districts = await response.json();

  console.log('features:', districts.features.length);
  console.log('first feature:', districts.features[0]);
  console.log('properties:', districts.features[0].properties);

  fillProvinceList();
  draw(districts.features);
}

loadData();
