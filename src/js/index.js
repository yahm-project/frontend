import "leaflet-polylinedecorator"
import "leaflet.markercluster"
import "leaflet.locatecontrol"

const MIN_ZOOM_TO_SHOW_DATA = 14

var POTHOLE_ICON = L.icon({
    iconUrl: 'assets/img/pot-hole-marker.png',
    iconSize: [35, 50], // size of the icon
    iconAnchor: [18, 50], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -25] // point from which the popup should open relative to the iconAnchor
});
var SPEEDBUMP_ICON = L.icon({
    iconUrl: 'assets/img/speed-bump-marker.png',
    iconSize: [35, 50], // size of the icon
    iconAnchor: [18, 50], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -25] // point from which the popup should open relative to the iconAnchor
});

var roadIssuesMarkerCluster = L.markerClusterGroup();
var legsLayer = L.layerGroup();
var overlayMaps = {
    "Road status": legsLayer,
    "Road issues": roadIssuesMarkerCluster
};

var mymap = L.map('map', {
    center: [44.133331, 12.233333],
    zoom: 18,
    maxNativeZoom: 18,
    maxZoom: 18,
    minZoom: 6,
    zoomControl: false,
    layer: [roadIssuesMarkerCluster, legsLayer]
});

const provider = new window.GeoSearch.OpenStreetMapProvider();
const searchControl = new window.GeoSearch.GeoSearchControl({
    provider: provider,
    style: 'bar',
    showMarker: false,
    autoClose: true,
    retainZoomLevel: true,
    searchLabel: 'Looking for new places?'
});

let legCache = new Map()
let qualityToColor = {
    0: "#7f0000",
    1: "#f44336",
    2: "#ffeb3b",
    3: "#1b5e20",
    4: "#4caf50",
};
var lastPositionUsedForUpdate = mymap.getCenter()

let obstacleCache = new Map() // cache for obstacles: "{type},{lat},{lng}" -> marker

function drawObstacle(coordinates, type, legFromId, legToId) {
    let key = type + "," + coordinates[0] + "," + coordinates[1]
    if (!obstacleCache.has(key)) {
        var icon = POTHOLE_ICON
        if (type == "POTHOLE") {
            console.log('pothole added')
        } else if (type == "SPEED_BUMP") {
            icon = SPEEDBUMP_ICON
            console.log('speed bump added')
        }
        var marker = L.marker(coordinates, {
            icon: icon
        })
        marker.bindPopup('<button type="button" class="btn btn-danger" onclick="deleteObstacle(' + coordinates + ',  \'' + type + '\')"><i class="fa fa-trash"></i> Elimina</button>')
        roadIssuesMarkerCluster.addLayer(marker);
        obstacleCache.set(key, {
            marker: marker,
            legFromId: legFromId,
            legToId: legToId
        })
    }
}

window.deleteObstacle = function(latitude, longitude, type) {
    let key = type + "," + latitude + "," + longitude
    if (obstacleCache.has(key)) {
        let obstacleInfo = obstacleCache.get(key)
        axios.delete(__SERVER_ENDPOINT__ + '/roads/obstacles', {
                params: {
                    latitude: latitude,
                    longitude: longitude,
                    obstacleType: type,
                    legFromId: obstacleInfo.legFromId,
                    legToId: obstacleInfo.legToId
                }
            }).then(response => {
                if (response.status = "200") {
                    let markerToDelete = obstacleInfo.marker
                    roadIssuesMarkerCluster.removeLayer(markerToDelete)
                    obstacleCache.delete(key)
                } else {
                    console.log('DELETE request on /roads/obstacles went wrong.')
                }
            })
            .catch(function(error) {
                console.log('An error occurred on /roads/obstacles DELETE request: ' + error);
            });
    }
}

function drawObstacles(obstaclesJson, legFromId, legToId) {
    if (obstaclesJson != null && Object.keys(obstaclesJson).length !== 0) {
        for (var obstacleType of Object.keys(obstaclesJson)) {
            obstaclesJson[obstacleType].forEach(obstacle => drawObstacle([obstacle.latitude, obstacle.longitude], obstacleType, legFromId, legToId))
        }
    }
}

function drawLegs(legsJsonArray) {
    legsJsonArray.forEach(leg => {
        var legObj = JSON.stringify({
            from: leg.from,
            to: leg.to
        })
        if (!legCache.has(legObj)) {
            var polyline = L.polyline([
                [leg.from.coordinates.latitude, leg.from.coordinates.longitude],
                [leg.to.coordinates.latitude, leg.to.coordinates.longitude]
            ], {
                color: qualityToColor[leg.quality],
                weight: 5,
            }).addTo(legsLayer);
            L.polylineDecorator(polyline, {
                patterns: [{
                    offset: '100%',
                    repeat: 0,
                    symbol: L.Symbol.dash({ pixelSize: 0, pathOptions: { color: "white", weight: 5 } })
                }]
            }).addTo(legsLayer);
            polyline.bindPopup('fromId: ' + leg.from.id + ' toId: ' + leg.to.id)
            legCache.set(legObj, polyline)
        } else {
            var polylineCached = legCache.get(legObj)
            if (polylineCached.color != qualityToColor[leg.quality]) {
                polylineCached.setStyle({
                    color: qualityToColor[leg.quality]
                });
            }
        }
        drawObstacles(leg.obstacles, leg.from.id, leg.to.id)
    });
}

function updateEvaluationAsync() {
    lastPositionUsedForUpdate = mymap.getCenter()
    axios.get(__SERVER_ENDPOINT__ + '/roads/evaluations', {
            params: {
                latitude: lastPositionUsedForUpdate.lat,
                longitude: lastPositionUsedForUpdate.lng,
                radius: mymap.getBounds().getCenter().distanceTo(mymap.getBounds().getNorthWest())
            }
        }).then(response => {
            if (response.status = "200") {
                drawLegs(response.data)
            } else {
                console.log('GET request on /roads/evaluations went wrong.')
            }
        })
        .catch(function(error) {
            console.log('An error occurred on /roads/evaluations GET request: ' + error);
        });
    console.log("refresh")
}


$(document).ready(function() {
    L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}?access_token=' + __MAPBOX_TOKEN__, {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mymap);

    L.control.layers(null, overlayMaps).addTo(mymap)
    L.control.zoom({
        position: 'bottomright'
    }).addTo(mymap);
    legsLayer.addTo(mymap)
    roadIssuesMarkerCluster.addTo(mymap)

    var lc = L.control.locate({
        position: 'bottomright',
        flyTo: true,
        circleStyle: {
            fillOpacity: 0.07
        },
        locateOptions: {
            enableHighAccuracy: true,
            maxZoom: 18
        },
        strings: {
            title: "Show me where I am, yo!"
        }
    }).addTo(mymap);
    lc.start()

    mymap.addControl(searchControl);

    var previousZoom = mymap.getZoom()
    mymap.on('movestart', ev => {
        previousZoom = mymap.getZoom()
    });

    mymap.on('moveend', ev => {
        if (
            (
                (previousZoom < mymap.getZoom() && previousZoom <= MIN_ZOOM_TO_SHOW_DATA) || //zoom in, zoomed enough
                (ev.flyTo != true && previousZoom > mymap.getZoom()) || //zoom out, still zoomed over minimum
                (!mymap.getBounds().contains(lastPositionUsedForUpdate)) // moved out of boundaries
            ) && mymap.getZoom() > MIN_ZOOM_TO_SHOW_DATA) {
            updateEvaluationAsync()
            console.log("[moveEnd] new data requested", ev)
        }
    });

    setInterval(() => {
        if (mymap.getZoom() > MIN_ZOOM_TO_SHOW_DATA) {
            updateEvaluationAsync()
        }
    }, 10000); //periodic update (ms)
    if (1 === 0) deleteObstacle(0, 0, 0) //workaround :(
    setTimeout(() => {
        $("#splashContainer").css({
            "visibility": "hidden",
            "height": "0% "
        });
        $("#pageContainer").css({
            "visibility": "visible",
            "height": "100% "
        });
    }, 4300)
});