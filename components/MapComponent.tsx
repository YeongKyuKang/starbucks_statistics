'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, Map as MapIcon, LocateFixed } from 'lucide-react';

// 스타벅스 브랜드 색상 마커 (메모리 효율을 위해 컴포넌트 외부 선언)
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
    html: `<div class="flex items-center justify-center w-10 h-10 bg-[#007042] text-white rounded-full border-4 border-white shadow-xl font-bold text-sm">
            ${cluster.getChildCount()}
          </div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(40, 40),
  });
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  // 부드러운 이동을 위해 flyTo 사용 및 속도 최적화
  useEffect(() => {
    map.flyTo(center, zoom, {
      animate: true,
      duration: 0.5 // 이동 속도를 빠르게 하여 로딩 지연 느낌 감소
    });
  }, [center, zoom, map]);
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

import { useEffect } from 'react';

export default function MapComponent({ stores, center, zoom }: MapProps) {
  return (
    <div className="relative w-full h-full bg-[#f8f9fa]">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        preferCanvas={true} // ✨ Canvas 렌더링 모드 활성화 (수천 개 마커 처리 시 성능 대폭 향상)
      >
        <ChangeView center={center} zoom={zoom} />
        <ZoomControl position="bottomright" />
        <LocationButton />
        
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          keepBuffer={8} // ✨ 보이지 않는 영역의 타일을 미리 로드하여 스크롤 시 끊김 방지
        />
        
        <MarkerClusterGroup 
          chunkedLoading={true} // ✨ 마커를 쪼개서 로드 (UI 프리징 방지)
          removeOutsideVisibleBounds={true} // ✨ 화면 밖 마커 제거로 성능 최적화
          spiderfyOnMaxZoom={true}
          iconCreateFunction={createClusterCustomIcon}
          animate={true}
        >
          {stores.map((store, index) => (
            <Marker 
              key={`${store.s_name}-${index}`} 
              position={[parseFloat(store.lat), parseFloat(store.lot)]}
              icon={customIcon}
            >
              <Popup maxWidth={280}>
                <div className="p-1 font-sans">
                  <h3 className="font-bold text-lg text-slate-800 mb-1">{store.s_name}</h3>
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