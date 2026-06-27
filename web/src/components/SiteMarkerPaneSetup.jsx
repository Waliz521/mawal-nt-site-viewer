import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export const SITE_MARKER_PANE = 'site-status-markers';

/** Site status dots render above boundary and KML polygon layers. */
export default function SiteMarkerPaneSetup() {
  const map = useMap();

  useEffect(() => {
    if (!map.getPane(SITE_MARKER_PANE)) {
      const pane = map.createPane(SITE_MARKER_PANE);
      pane.style.zIndex = 650;
    }
  }, [map]);

  return null;
}
