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

// On-brand pin as a divIcon — avoids Leaflet's default marker PNGs, whose bundler
// asset paths break under Next/Turbopack. Amber = machine-suggested (B0, unconfirmed);
// rose = confirmed ground truth (B1).
function makePin(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:20px;height:20px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(60,40,48,.5)"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}
const CONFIRMED_PIN = makePin("#ef5775");
const SUGGESTED_PIN = makePin("#c58a21");

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
  suggested = false,
}: {
  location?: GeoPoint;
  editable?: boolean;
  onChange?: (p: GeoPoint) => void;
  height?: number;
  className?: string;
  suggested?: boolean; // amber machine-suggestion (B0) vs rose confirmed (B1)
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
            icon={suggested ? SUGGESTED_PIN : CONFIRMED_PIN}
            draggable={editable}
            eventHandlers={editable ? { dragend: (e) => { const ll = e.target.getLatLng(); onChange?.({ lat: ll.lat, lng: ll.lng }); } } : undefined}
          />
        )}
      </MapContainer>
    </div>
  );
}
