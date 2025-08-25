import 'leaflet';
import 'leaflet.markercluster';
import htm from 'htm';
import { h, render } from 'preact';

// Initialize htm with Preact
const html = htm.bind(h);

// Configuration
/** @type [number, number] */
const DEFAULT_VIEW = [59.9343, 30.3351];
const DEFAULT_ZOOM = 12;
const CLOSE_ZOOM = 16;

// State
let landmarks = [];
let searchTerm = '';

// Initialize the map
const map = L.map('map').setView(DEFAULT_VIEW, DEFAULT_ZOOM);

// Base layers
const baseLayers = {
    "Street Map": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    "Dark Mode": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    })
};

// Add default base layer
baseLayers["Street Map"].addTo(map);

// Create layer control
L.control.layers(baseLayers).addTo(map);

// Create marker cluster group
const markers = L.markerClusterGroup();
map.addLayer(markers);

// Add controls
map.addControl(L.control.zoom({ position: 'topright' }));
L.control.scale().addTo(map);

// Reset view control
const resetControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'leaflet-control-reset', container);
        button.href = '#';
        button.title = 'Reset view to St. Petersburg';
        button.innerHTML = '↻';
        L.DomEvent.on(button, 'click', (e) => {
            e.preventDefault();
            map.setView(DEFAULT_VIEW, DEFAULT_ZOOM);
        });
        return container;
    }
});
map.addControl(new resetControl());

// Load landmarks and render UI
async function loadLandmarks() {
    landmarks = await (await fetch('/landmarks.json')).json();
    renderLandmarks();
}

// Render function using Preact
function renderLandmarks() {
    // Clear and update map markers
    markers.clearLayers();

    const filteredLandmarks = landmarks.filter(landmark =>
        landmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        landmark.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredLandmarks.forEach(landmark => {
        const marker = L.marker([landmark.lat, landmark.lng], { title: landmark.title });

        marker.bindPopup(() => {
            const container = document.createElement('div');
            render(html`
                <div class="custom-popup">
                    <h3>${landmark.title}</h3>
                    ${landmark.image ? html`<img src="${landmark.image}" class="popup-image" alt="${landmark.title}">` : ''}
                    <p>${landmark.description}</p>
                    <small>Coordinates: ${landmark.lat.toFixed(4)}, ${landmark.lng.toFixed(4)}</small>
                </div>
            `, container);
            return container
        }, { maxWidth: 300, className: 'custom-popup' });

        markers.addLayer(marker);
    });

    // Render UI with Preact — now it won't lose input focus!
    const sidebar = document.getElementById('sidebar');
    render(html`
        <div class="app-container">
            <div class="sidebar">
                <div class="search-container">
                    <input
                        type="text"
                        placeholder="Search landmarks..."
                        onInput=${e => {
                            searchTerm = e.target.value;
                            renderLandmarks();
                        }}
                        value=${searchTerm}
                        autocomplete="off"
                    />
                </div>
                <div class="landmarks-list">
                    ${filteredLandmarks.map(landmark => html`
                        <div
                            class="landmark-item"
                            onClick=${() => {
                                map.setView([landmark.lat, landmark.lng], CLOSE_ZOOM);
                                const marker = markers.getLayers().find(m => {
                                    // @ts-expect-error
                                    return m.options.title === landmark.title
                                });
                                if (marker) marker.openPopup();
                            }}
                        >
                            <strong>${landmark.title}</strong>
                            <p>${landmark.description.substring(0, 60)}...</p>
                        </div>
                    `)}
                </div>
            </div>
            <div id="map" class="map-container"></div>
        </div>
    `, sidebar);
}

// Initialize the app
loadLandmarks();
