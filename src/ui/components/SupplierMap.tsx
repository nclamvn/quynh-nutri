"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint } from "@/domain/types";

// Free OpenStreetMap tiles — no API key. Attribution is required by the OSM
// tile-usage policy and shown by default via TileLayer's `attribution`.
const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
// Neutral fallback centre (TP.HCM) when a household hasn't placed a pin yet.
const DEFAULT_CENTER: GeoPoint = { lat: 10.7769, lng: 106.7009 };

// On-brand rose pin as a divIcon — avoids Leaflet's default marker PNGs, whose
// bundler asset paths break under Next/Turbopack.
const pinIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:20px;height:20px;border-radius:9999px;background:#ef5775;border:3px solid #fff;box-shadow:0 2px 6px rgba(150,40,64,.5)"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function ClickToPlace({ onPick }: { onPick: (p: GeoPoint) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export default function SupplierMap({
  location,
  editable = false,
  onChange,
  height = 200,
  className = "",
}: {
  location?: GeoPoint;
  editable?: boolean;
  onChange?: (p: GeoPoint) => void;
  height?: number;
  className?: string;
}) {
  const center = location ?? DEFAULT_CENTER;
  // Stable initial center/zoom — react-leaflet ignores prop changes after mount,
  // which is exactly what we want (the marker moves, the viewport stays put).
  const initial = useMemo(() => ({ center: [center.lat, center.lng] as [number, number], zoom: location ? 16 : 12 }), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`overflow-hidden rounded-[14px] border border-hairline ${className}`} style={{ height }}>
      <MapContainer center={initial.center} zoom={initial.zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer url={OSM_URL} attribution={OSM_ATTR} />
        {editable && <ClickToPlace onPick={(p) => onChange?.(p)} />}
        {location && (
          <Marker
            position={[location.lat, location.lng]}
            icon={pinIcon}
            draggable={editable}
            eventHandlers={editable ? { dragend: (e) => { const ll = e.target.getLatLng(); onChange?.({ lat: ll.lat, lng: ll.lng }); } } : undefined}
          />
        )}
      </MapContainer>
    </div>
  );
}
