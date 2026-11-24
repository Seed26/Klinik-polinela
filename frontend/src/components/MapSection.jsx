import { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Politeknik Negeri Lampung coordinates
const POLINELA_LOCATION = {
  lat: -5.358532,
  lng: 105.23246
};

export default function MapSection() {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      // Fallback: use embed without info panel using specific parameters
      setMapLoaded(false);
      return;
    }

    // Load Google Maps JavaScript API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = () => {
      if (mapRef.current) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: POLINELA_LOCATION,
          zoom: 17,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false, // Disable POI clicks (prevents info windows)
        });

        // Add custom marker
        new window.google.maps.Marker({
          position: POLINELA_LOCATION,
          map: map,
          title: 'Politeknik Negeri Lampung',
        });

        setMapLoaded(true);
      }
    };

    script.onerror = () => {
      setLoadError(true);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.remove();
      }
      delete window.initMap;
    };
  }, []);

  // If no API key or error, use clean embed
  if (!GOOGLE_MAPS_API_KEY || loadError) {
    return (
      <div className="landing-map-placeholder">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.3820763395984!2d105.23026594924802!3d-5.358531996094019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e40c54fa0db33eb%3A0xe69b7788ca97353a!2sPoliteknik%20Negeri%20Lampung!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid&output=embed&iwloc=near"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Peta Lokasi Politeknik Negeri Lampung"
        />
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="landing-map-placeholder"
      style={{ minHeight: '380px' }}
    />
  );
}
