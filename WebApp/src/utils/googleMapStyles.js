/** Dark map theme aligned with the web dashboard palette. */
export const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8e' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2a2a2c' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b70' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1f2a1f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1f1f21' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a3d' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2a2a2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1419' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
];
