import { html } from '../html.js'

export default html`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Map of Saint Petersburg</title>
    
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossorigin=""/>
    
    <!-- Leaflet MarkerCluster CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css">
    
    <link rel="stylesheet" href="./map.css">
</head>
<body>
    <div id="map-container">
        <div id="map"></div>
        <div id="sidebar">
            <h1>Saint Petersburg Landmarks</h1>
            
            <div class="search-container">
                <input type="text" id="search" placeholder="Search landmarks...">
            </div>
            
            <div id="landmarks-list">
                <!-- Landmarks will be added here dynamically -->
            </div>
        </div>
    </div>
    
    <script src="./map.js" type="module"></script>
</body>
</html>`;
