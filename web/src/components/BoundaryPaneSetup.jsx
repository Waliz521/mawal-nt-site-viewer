import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { BOUNDARY_PANE } from '../lib/boundaries';

/** Reference boundary layers sit below interactive KML polygons and site markers. */
export default function BoundaryPaneSetup() {
  const map = useMap();

  useEffect(() => {
    if (!map.getPane(BOUNDARY_PANE)) {
      const pane = map.createPane(BOUNDARY_PANE);
      pane.style.zIndex = 350;
    }
  }, [map]);

  return null;
}
