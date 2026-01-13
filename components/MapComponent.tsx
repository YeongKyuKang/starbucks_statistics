'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet 아이콘 설정
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface MapProps {
  stores: any[];
  center: [number, number];
  zoom: number;
}

export default function MapComponent({ stores, center, zoom }: MapProps) {
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
    >
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* 🔴 수정된 부분: key를 s_code 대신 (매장명 + 인덱스) 조합으로 변경 */}
      {stores.map((store, index) => (
        <Marker 
          key={`${store.s_name}-${index}`} 
          position={[parseFloat(store.lat), parseFloat(store.lot)]}
          icon={icon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg">{store.s_name}</h3>
              <p className="text-sm text-gray-600">{store.addr}</p>
              {/* 데이터에 없는 필드(gugun_name 등)는 화면에 안 나오게 처리하거나 안전하게 표시 */}
              <div className="mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block">
                Starbucks Store
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}