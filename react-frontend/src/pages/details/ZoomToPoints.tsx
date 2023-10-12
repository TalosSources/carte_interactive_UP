import { type Initiative, initiativeLocationFeatureToGeoCoordinate } from '../../lib/KesApi';
import { useMap } from 'react-leaflet';
import { GeoBoundingBox } from '../../lib/BoundingBox';

export function ZoomToPoints({ initiative }: { initiative: Initiative; }): null {
  if (initiative.locations.features.length === 0) {
    return null;
  }
  const bb = GeoBoundingBox.fromCoordinates(initiative.locations.features.map((feature) => initiativeLocationFeatureToGeoCoordinate(feature)));
  const map = useMap();
  map.fitBounds([
    [bb.getTopLeft().getLatitude(), bb.getTopLeft().getLongitude()],
    [bb.getBottomRight().getLatitude(), bb.getBottomRight().getLongitude()]
  ]);
  return null;
}
