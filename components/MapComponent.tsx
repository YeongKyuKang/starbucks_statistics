'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster'; // ✨ 핵심 추가
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
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // ✨ 좀 더 깔끔한 지도 스타일로 변경
      />
      
      {/* 🚀 성능 핵심: 클러스터링 적용 (chunkedLoading으로 렌더링 최적화) */}
      <MarkerClusterGroup 
        chunkedLoading 
        spiderfyOnMaxZoom={true}
      >
        {stores.map((store, index) => (
          <Marker 
            key={`${store.s_name}-${index}`} 
            position={[parseFloat(store.lat), parseFloat(store.lot)]}
            icon={icon}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <h3 className="font-bold text-base mb-1 text-green-700">{store.s_name}</h3>
                <p className="text-xs text-gray-600 border-t pt-1">{store.addr}</p>
                <div className="mt-2 text-[10px] bg-gray-100 px-2 py-1 rounded inline-block text-gray-500">
                  {store.sido_name} {store.gugun_name}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}