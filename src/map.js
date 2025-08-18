import L from 'leaflet';
import 'leaflet.markercluster';

const landmarks = await (await fetch('/landmarks.json')).json();

// Initialize the map centered on Saint Petersburg
const map = L.map('map').setView([59.9343, 30.3351], 12);

// Add OpenStreetMap base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add alternative map layers
const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
});

// Create layer control
const baseLayers = {
    "Street Map": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    "Satellite": satelliteLayer,
    "Dark Mode": darkLayer
};

L.control.layers(baseLayers).addTo(map);

// Create marker cluster group
const markers = L.markerClusterGroup();

// Add landmarks to map and sidebar
const landmarksList = document.getElementById('landmarks-list');

landmarks.forEach(landmark => {
    // Create marker with custom icon
    const marker = L.marker([landmark.lat, landmark.lng], {
        title: landmark.title
    });
    
    // Create popup content
    const popupContent = `
        <div class="custom-popup">
            <h3>${landmark.title}</h3>
            ${landmark.image ? `<img src="${landmark.image}" class="popup-image" alt="${landmark.title}">` : ''}
            <p>${landmark.description}</p>
            <small>Coordinates: ${landmark.lat.toFixed(4)}, ${landmark.lng.toFixed(4)}</small>
        </div>
    `;
    
    marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
    });
    
    // Add marker to cluster group
    markers.addLayer(marker);
    
    // Add to sidebar
    const landmarkItem = document.createElement('div');
    landmarkItem.className = 'landmark-item';
    landmarkItem.innerHTML = `<strong>${landmark.title}</strong><p>${landmark.description.substring(0, 60)}...</p>`;
    
    landmarkItem.addEventListener('click', () => {
        map.setView([landmark.lat, landmark.lng], 16);
        marker.openPopup();
    });
    
    landmarksList.appendChild(landmarkItem);
});

// Add markers to map
map.addLayer(markers);

// Search functionality
const searchInput = document.getElementById('search');

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const landmarkItems = document.querySelectorAll('.landmark-item');
    
    landmarkItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
});

// Add geolocation control
map.addControl(L.control.zoom({position: 'topright'}));

// Add scale control
L.control.scale().addTo(map);

// Add geolocation button
const locateControl = L.control.locate({
    position: 'topright',
    strings: {
        title: "Show my location"
    }
}).addTo(map);

// Add button to reset view to St. Petersburg
const resetControl = L.Control.extend({
    options: {
        position: 'topright'
    },
    
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'leaflet-control-reset', container);
        button.href = '#';
        button.title = 'Reset view to St. Petersburg';
        button.innerHTML = '↻';
        
        L.DomEvent.on(button, 'click', function(e) {
            e.preventDefault();
            map.setView([59.9343, 30.3351], 12);
        });
        
        return container;
    }
});

map.addControl(new resetControl());