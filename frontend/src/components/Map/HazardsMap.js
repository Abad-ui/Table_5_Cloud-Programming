import { useEffect }from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './HazardsMap.module.css';
import naturalIcon from '../../assets/images/naturalIcon.png';
import infrastructureIcon from '../../assets/images/infrastructureIcon.png';
import utilityIcon from '../../assets/images/utilityIcon.png';
import humanIcon from '../../assets/images/humanIcon.png';


// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons based on category
const createCustomIcon = (category) => {
  // Match category to icon file
  const iconMap = {
    'Natural': require('../../assets/images/naturalIcon.png'),
    'Infrastructure': require('../../assets/images/infrastructureIcon.png'),
    'Utility': require('../../assets/images/utilityIcon.png'),
    'Human-Induced': require('../../assets/images/humanIcon.png'),
  };

  const iconUrl = iconMap[category] || require('../../assets/images/logo.png');

  return L.icon({
    iconUrl,
    iconSize: [20, 20], // adjust as needed
    iconAnchor: [17, 34],
    popupAnchor: [0, -28],
    className: 'hazard-icon'
  });
};


/*const getColorByCategory = (category) => {
  const colors = {
    'Natural': '#10b981',      // Green
    'Infrastructure': '#f59e0b', // Amber
    'Utility': '#3b82f6',      // Blue
    'Human-Induced': '#ec4899' // Pink
  };
  return colors[category] || '#6b7280'; // Gray for unknown
};*/

function LegendControl() {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: 'bottomleft' });

    legend.onAdd = function () {
      const div = L.DomUtil.create('div', styles.legend);

      const h4 = L.DomUtil.create('h4', '', div);
      h4.textContent = 'Hazard Categories';

      const icons = [
        { src: naturalIcon, label: 'Natural' },
        { src: infrastructureIcon, label: 'Infrastructure' },
        { src: utilityIcon, label: 'Utility' },
        { src: humanIcon, label: 'Human-Induced' },
      ];

      icons.forEach(({ src, label }) => {
        const item = L.DomUtil.create('div', styles.legendItem, div);

        const img = L.DomUtil.create('img', '', item);
        img.src = src;
        img.alt = label;

        const text = document.createTextNode(` ${label}`);
        item.appendChild(img);
        item.appendChild(text);
      });

      return div;
    };

    legend.addTo(map);

    return () => {
      map.removeControl(legend);
    };
  }, [map]);

  return null;
}

const dagupanBounds = [
  [16.0000, 120.2800], // Southwest corner
  [16.1000, 120.4000]  // Northeast corner
];

// Component to handle map click events
function MapClickHandler({ onMapClick, selectedLocation }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e);
      }
    },
  });

  // Show selected location marker
  return selectedLocation ? (
    <Marker position={selectedLocation}>
      <Popup>
        Selected Location<br />
        Lat: {selectedLocation[0].toFixed(6)}<br />
        Lng: {selectedLocation[1].toFixed(6)}
      </Popup>
    </Marker>
  ) : null;
}

const HazardsMap = ({ hazards, height = "100%", onMapClick, selectedLocation, onMarkerClick }) => {
  // Dagupan City coordinates
  const dagupanCenter = [16.0439, 120.3331];
  
  // Filter out hazards without coordinates
  const hazardsWithCoords = hazards.filter(hazard => 
    hazard.location && hazard.location.lat && hazard.location.lng
  );

  // Helper function to get status class
  const getStatusClass = (status) => {
    const statusMap = {
      'reported': styles.statusReported,
      'in progress': styles.statusInProgress,
      'resolved': styles.statusResolved,
      'not started': styles.statusNotStarted
    };
    return statusMap[status?.toLowerCase()] || styles.statusNotStarted;
  };

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={selectedLocation || dagupanCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        maxBounds={dagupanBounds}
        maxBoundsViscosity={1.0} // prevents dragging outside bounds
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LegendControl />
        
        {/* Map click handler and selected location marker */}
        <MapClickHandler onMapClick={onMapClick} selectedLocation={selectedLocation} />
        
        {/* Existing hazard markers */}
        {hazardsWithCoords.map((hazard) => (
          <Marker
            key={hazard._id}
            position={[hazard.location.lat, hazard.location.lng]}
            icon={createCustomIcon(hazard.category)}
          >
            <Popup>
              <div className={styles.hazardPopup}>
                <h4 className={styles.popupHeader}>{hazard.category} - {hazard.subtype}</h4>
                
                {hazard.photoUrl && (
                  <div className={styles.popupImage}>
                    <img 
                      src={`http://localhost:4000${hazard.photoUrl}`} 
                      alt={hazard.subtype}
                      style={{ 
                        width: '100%', 
                        maxHeight: '150px', 
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className={styles.popupDetails}>
                  <p><strong>Description:</strong> {hazard.description}</p>
                  <p><strong>Status:</strong> 
                    <span className={`${styles.statusBadge} ${getStatusClass(hazard.fixedStatus)}`}>
                      {hazard.fixedStatus}
                    </span>
                  </p>
                  {hazard.address?.fullAddress ? (
                    <p><strong>Address:</strong> {hazard.address.fullAddress}</p>
                  ) : (
                    <p><strong>Coordinates:</strong> 
                      {hazard.location.lat.toFixed(6)}, {hazard.location.lng.toFixed(6)}
                    </p>
                  )}
                  {hazard.verifiedBy && (
                    <p><strong>Verified by:</strong> {hazard.verifiedBy.username}</p>
                  )}
                  
                  <p><strong>Reported:</strong> {new Date(hazard.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default HazardsMap;