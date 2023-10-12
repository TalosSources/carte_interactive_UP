import React, { Suspense } from 'react';
import { MapContainer, TileLayer, useMapEvent } from 'react-leaflet';
import { type LeafletEvent } from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { GeoCoordinate } from '../../lib/Coordinate';
import { GeoBoundingBox } from '../../lib/BoundingBox';
import { MapMarkers } from './MapMarkers';

export function SKMapContainer({ setMapCenter, setMapBounds, tags, searchQuery, bb }: { setMapCenter: (newCenter: GeoCoordinate) => void; setMapBounds: (newBounds: GeoBoundingBox) => void; tags: string[]; searchQuery: string; bb: GeoBoundingBox | 'Hide global' | 'Show all'; }): React.JSX.Element {
  function leafletToGeoCoordinate(leafletCoordinate: { lng: number; lat: number; }): GeoCoordinate {
    return new GeoCoordinate({ longitude: leafletCoordinate.lng, latitude: leafletCoordinate.lat });
  }

  function RegisterMapCenter(): null {
    // const _map = useMapEvent('moveend', (e: LeafletEvent) => {
    useMapEvent('moveend', (e: LeafletEvent) => {
      setMapCenter(leafletToGeoCoordinate(e.target.getCenter()));

      const newBounds = e.target.getBounds();
      setMapBounds(GeoBoundingBox.fromCoordinates([
        leafletToGeoCoordinate(newBounds._northEast),
        leafletToGeoCoordinate(newBounds._southWest)
      ]
      ));
    });
    return null;
  }
  return <MapContainer
    id="map"
    center={[59, 15]}
    zoom={6}
    scrollWheelZoom={false}
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <RegisterMapCenter />
    <MarkerClusterGroup chunkedLoading>
      <Suspense fallback={<></>}>
        <MapMarkers tags={tags} searchQuery={searchQuery} bb={bb} />
      </Suspense>
    </MarkerClusterGroup>
  </MapContainer>;
}
