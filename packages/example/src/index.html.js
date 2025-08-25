import { html } from 'elbebe';

const title = 'Interactive Map of Saint Petersburg';

export default html`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="./map.css">
</head>
<body>
    <div id="map-container">
        <div id="map"></div>
        <div id="sidebar">
        </div>
    </div>
    
    <script src="./map.js" type="module"></script>
</body>
</html>`;
