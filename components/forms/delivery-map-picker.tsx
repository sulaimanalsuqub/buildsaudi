"use client";

import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const pinIcon = L.icon({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const RIYADH: [number, number] = [24.7136, 46.6753];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type Props = {
  value: { lat: number; lng: number } | null;
  onChange: (pos: { lat: number; lng: number }) => void;
  isRtl?: boolean;
};

export function DeliveryMapPicker({ value, onChange, isRtl = false }: Props) {
  const [center] = useState<[number, number]>(value ? [value.lat, value.lng] : RIYADH);

  return (
    <div className="overflow-hidden rounded-xl border border-brand-dark/15">
      <MapContainer center={center} zoom={value ? 14 : 6} style={{ height: "320px", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={(lat, lng) => onChange({ lat, lng })} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target as L.Marker;
                const pos = marker.getLatLng();
                onChange({ lat: pos.lat, lng: pos.lng });
              },
            }}
          />
        )}
      </MapContainer>
      <p className="border-t border-brand-dark/10 bg-brand-light/40 px-4 py-2 text-xs text-brand-dark/60">
        {isRtl ? "اضغط على الخريطة لتحديد موقع التسليم، أو اسحب العلامة لضبطها." : "Tap the map to set the delivery location, or drag the pin to adjust it."}
      </p>
    </div>
  );
}
