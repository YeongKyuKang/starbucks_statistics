'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, Map as MapIcon, LocateFixed } from 'lucide-react';

// 스타벅스 브랜드 색상 마커
const customIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// 클러스터 아이콘 스타일
const createClusterCustomIcon = (cluster: any) => {
  return L.divIcon({
    html: `<div class="flex items-center justify-center w-10 h-10 bg-[#007042] text-white rounded-full border-4 border-white shadow-xl font-bold text-sm transform hover:scale-110 transition-transform">
            ${cluster.getChildCount()}
          </div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(40, 40),
  });
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function LocationButton() {
  const map = useMap();
  const handleLocate = () => {
    map.locate().on("locationfound", (e) => {
      map.flyTo(e.latlng, 15);
    });
  };

  return (
    <div className="leaflet-bottom leaflet-right mb-6 mr-3">
      <button 
        onClick={handleLocate}
        className="bg-white p-3 rounded-full shadow-2xl border border-slate-200 hover:bg-slate-50 transition-colors pointer-events-auto"
      >
        <LocateFixed className="w-6 h-6 text-[#007042]" />
      </button>
    </div>
  );
}

interface MapProps {
  stores: any[];
  center: [number, number];
  zoom: number;
}

export default function MapComponent({ stores, center, zoom }: MapProps) {
  return (
    <div className="relative w-full h-full">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <ChangeView center={center} zoom={zoom} />
        <ZoomControl position="bottomright" />
        <LocationButton />
        
        {/* 🌏 한글 지명이 잘 나오는 OSM HOT 타일 (인증키 필요 없음) */}
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />
        
        <MarkerClusterGroup 
          chunkedLoading 
          spiderfyOnMaxZoom={true}
          iconCreateFunction={createClusterCustomIcon}
        >
          {stores.map((store, index) => (
            <Marker 
              key={`${store.s_name}-${index}`} 
              position={[parseFloat(store.lat), parseFloat(store.lot)]}
              icon={customIcon}
            >
              <Popup maxWidth={280}>
                <div className="p-1 font-sans">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800">{store.s_name}</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-3 flex items-start gap-1">
                    <MapIcon size={14} className="mt-0.5 shrink-0 text-slate-400" />
                    {store.addr}
                  </p>
                  <div className="flex gap-2 border-t pt-3">
                    <a 
                      href={`https://map.kakao.com/link/to/${store.s_name},${store.lat},${store.lot}`}
                      target="_blank"
                      className="flex-1 bg-[#007042] text-white text-center py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#005c36]"
                    >
                      <Navigation size={12} /> 길찾기
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}