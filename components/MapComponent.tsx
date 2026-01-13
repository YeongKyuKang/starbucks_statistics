'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, Map as MapIcon, LocateFixed } from 'lucide-react';

// 스타벅스 맞춤형 마커 아이콘 설정
const customIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// 클러스터 아이콘 디자인 (한글 지도와 잘 어울리는 화이트/그린 조합)
const createClusterCustomIcon = function (cluster: any) {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div class="flex items-center justify-center w-10 h-10 bg-green-700 text-white rounded-full border-4 border-white shadow-xl font-bold text-sm transform hover:scale-110 transition-transform">
            ${count}
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

// 내 위치 찾기 버튼 컨트롤
function LocationButton() {
  const map = useMap();
  const handleLocate = () => {
    map.locate().on("locationfound", (e) => {
      map.flyTo(e.latlng, 15);
    });
  };

  return (
    <div className="leaflet-bottom leaflet-right mb-24 mr-3">
      <button 
        onClick={handleLocate}
        className="bg-white p-3 rounded-full shadow-2xl border border-slate-200 hover:bg-slate-50 transition-colors pointer-events-auto group"
        title="내 위치 찾기"
      >
        <LocateFixed className="w-6 h-6 text-green-700 group-active:scale-90 transition-transform" />
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
        
        {/* 🌏 브이월드(Vworld) 한글 타일 레이어 적용 (한글 지명 명확) */}
        <TileLayer
          attribution='&copy; <a href="http://www.vworld.kr/">Vworld</a> contributors'
          url="https://api.vworld.kr/req/wmts/1.0.0/7E246944-C82D-3D96-8804-6A4739506692/Base/{z}/{y}/{x}.png"
        />
        
        <MarkerClusterGroup 
          chunkedLoading 
          spiderfyOnMaxZoom={true}
          iconCreateFunction={createClusterCustomIcon}
          showCoverageOnHover={false}
        >
          {stores.map((store, index) => (
            <Marker 
              key={`${store.s_name}-${index}`} 
              position={[parseFloat(store.lat), parseFloat(store.lot)]}
              icon={customIcon}
            >
              <Popup maxWidth={280} className="custom-popup">
                <div className="p-1 font-sans">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight pr-4">
                      {store.s_name}
                    </h3>
                    {store.s_name.includes("DT") && (
                      <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">DT</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-3 flex items-start gap-1 leading-snug">
                    <MapIcon size={14} className="mt-0.5 shrink-0 text-slate-400" />
                    {store.addr}
                  </p>
                  
                  <div className="flex gap-2 border-t pt-3">
                    <a 
                      href={`https://map.kakao.com/link/to/${store.s_name},${store.lat},${store.lot}`}
                      target="_blank"
                      className="flex-1 bg-green-700 text-white text-center py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-green-800 transition-colors shadow-sm"
                    >
                      <Navigation size={12} /> 길찾기
                    </a>
                    <div className="bg-slate-100 px-3 py-2 rounded-lg text-[11px] text-slate-500 font-medium">
                      {store.gugun_name}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* 우측 상단 범례(Legend) */}
      <div className="absolute top-4 right-4 z-[400] hidden md:block">
        <div className="bg-white/95 backdrop-blur shadow-lg border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] text-slate-600 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-green-600 rounded-full"></span>
            <span className="font-bold uppercase tracking-tighter">Store</span>
          </div>
          <div className="flex items-center gap-1.5 border-l pl-4">
            <span className="w-3 h-3 border-2 border-green-700 rounded-full flex items-center justify-center text-[8px] font-bold text-green-700">5</span>
            <span className="font-bold uppercase tracking-tighter">Cluster</span>
          </div>
        </div>
      </div>
    </div>
  );
}