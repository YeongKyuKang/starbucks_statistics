'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { MapPin, Coffee, Building2, BookOpen, Warehouse, Car, Search, Filter } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// 지도는 용량이 크므로 SSR 제외 및 로딩 상태 유지
const MapWithNoSSR = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500 italic">지도를 최적화하는 중...</p>
      </div>
    </div>
  )
});

const SIDO_CODES = [
  '서울', '경기', '부산', '대구', '인천', '광주', '대전', '울산', 
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '세종'
];

export default function Home() {
  const [allStores, setAllStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSido, setSelectedSido] = useState('All');
  const [selectedGugun, setSelectedGugun] = useState('All');
  const [mapCenter, setMapCenter] = useState<[number, number]>([36.5, 127.5]);
  const [mapZoom, setMapZoom] = useState(7);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/starbucks_data.json', { cache: 'force-cache' });
        const data = await res.json();
        setAllStores(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredStores = useMemo(() => {
    return allStores.filter(store => {
      const matchSido = selectedSido === 'All' || store.sido_name === selectedSido;
      const matchGugun = selectedGugun === 'All' || store.gugun_name === selectedGugun;
      return matchSido && matchGugun;
    });
  }, [allStores, selectedSido, selectedGugun]);

  const gugunList = useMemo(() => {
    if (selectedSido === 'All') return [];
    const guguns = new Set(allStores
      .filter(s => s.sido_name === selectedSido)
      .map(s => s.gugun_name)
      .filter(Boolean)
    );
    return Array.from(guguns).sort();
  }, [allStores, selectedSido]);

  const regionStats = useMemo(() => {
    const counts: {[key: string]: number} = {};
    filteredStores.forEach(s => {
      const key = selectedSido === 'All' ? s.sido_name : s.gugun_name;
      if(key) counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
  }, [filteredStores, selectedSido]);

  const recommendation = useMemo(() => {
    if (filteredStores.length === 0) return null;

    let univCount = 0; let officeCount = 0; let hipCount = 0; let dtCount = 0;

    filteredStores.forEach(s => {
      const name = (s.s_name || "").toLowerCase();
      const addr = (s.addr || "").toLowerCase();
      
      if (name.includes("univ") || name.includes("대학") || name.includes("학교")) univCount++;
      if (name.includes("타워") || name.includes("파이낸스") || name.includes("삼성") || name.includes("역") || addr.includes("테헤란")) officeCount++;
      if (addr.includes("성수") || addr.includes("가로수") || addr.includes("연남") || addr.includes("이태원")) hipCount++;
      if (name.includes("dt")) dtCount++;
    });

    const total = filteredStores.length;
    let type = "주거/생활권";
    let message = "거주민 중심의 안정적인 수요 지역입니다.";
    let strategy = "편안한 소파석 중심의 공간 구성";
    let icon = <Coffee className="w-5 h-5 text-green-600" />;

    if (univCount / total > 0.05) {
      type = "대학가 핵심";
      message = "카공족 및 학업 목적의 유동인구가 매우 많습니다.";
      strategy = "1인 콘센트석 및 집중 학습 환경 강화";
      icon = <BookOpen className="w-5 h-5 text-blue-500" />;
    } else if (officeCount / total > 0.25) {
      type = "오피스 타운";
      message = "출퇴근 및 점심시간대 회전율이 폭발적인 상권입니다.";
      strategy = "모바일 픽업존 및 퀵 카운터 최적화";
      icon = <Building2 className="w-5 h-5 text-slate-700" />;
    } else if (hipCount > 0 || selectedGugun === '성동구' || selectedGugun === '마포구') {
      type = "핫플레이스";
      message = "2030 트렌드 세터의 방문이 잦은 지역입니다.";
      strategy = "리저브 전용 매장 및 시즌 한정 MD 배치";
      icon = <Warehouse className="w-5 h-5 text-purple-600" />;
    } else if (dtCount / total > 0.15) {
      type = "드라이브 스루";
      message = "차량 이동량이 많아 포장 수요가 높은 위치입니다.";
      strategy = "DT 차로 확보 및 신속 주문 시스템 운영";
      icon = <Car className="w-5 h-5 text-orange-500" />;
    }

    return { type, message, strategy, icon };
  }, [filteredStores, selectedGugun]);

  const handleSidoChange = (sido: string) => {
    setSelectedSido(sido);
    setSelectedGugun('All');
    if (sido === 'All') {
      setMapCenter([36.5, 127.5]); setMapZoom(7);
    } else {
      const target = allStores.find(s => s.sido_name === sido);
      if (target) {
        setMapCenter([parseFloat(target.lat), parseFloat(target.lot)]);
        setMapZoom(11);
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-white text-slate-900 overflow-hidden font-sans">
      
      {/* 🗺️ 지도 섹션 (모바일에서 위 60%) */}
      <div className="w-full h-[60%] md:h-full md:flex-1 relative order-1 md:order-2 border-b md:border-b-0 bg-slate-50">
        <MapWithNoSSR stores={filteredStores} center={mapCenter} zoom={mapZoom} />
      </div>

      {/* 🎛️ 사이드 패널 (모바일에서 아래 40%) */}
      <div className="w-full h-[40%] md:h-full md:w-[380px] bg-white order-2 md:order-1 flex flex-col z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:shadow-xl transition-all">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#007042] p-1.5 rounded-lg shadow-md">
              <Coffee className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">스타벅스 입지 분석</h1>
          </div>
          {loading && <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {/* 필터 */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Filter size={12} /> 지역 설정
              </label>
              <span className="text-[10px] bg-green-50 px-2 py-0.5 rounded-full text-[#007042] font-black">
                {filteredStores.length.toLocaleString()} 매장
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <select 
                  className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#007042] outline-none appearance-none cursor-pointer"
                  value={selectedSido}
                  onChange={(e) => handleSidoChange(e.target.value)}
                >
                  <option value="All">전국 전체</option>
                  {SIDO_CODES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Search className="absolute right-2.5 top-3 text-slate-300 w-4 h-4 pointer-events-none" />
              </div>
              
              <select 
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#007042] outline-none appearance-none disabled:opacity-30 cursor-pointer"
                disabled={selectedSido === 'All'}
                value={selectedGugun}
                onChange={(e) => {
                  setSelectedGugun(e.target.value);
                  const target = allStores.find(s => s.sido_name === selectedSido && s.gugun_name === e.target.value);
                  if (target) { setMapCenter([parseFloat(target.lat), parseFloat(target.lot)]); setMapZoom(13); }
                }}
              >
                <option value="All">구/군 전체</option>
                {gugunList.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* AI 추천 리포트 */}
          {recommendation && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">{recommendation.icon}</div>
                <h3 className="font-black text-slate-800 text-sm">{recommendation.type}</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{recommendation.message}</p>
              <div className="bg-white/80 p-2.5 rounded-xl border border-green-200">
                <p className="text-[11px] font-bold text-[#007042]">💡 전략: {recommendation.strategy}</p>
              </div>
            </div>
          )}

          {/* 차트 */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">분포 순위</label>
            <div className="h-36 w-full">
              <Bar 
                data={{
                  labels: Object.keys(regionStats),
                  datasets: [{
                    data: Object.values(regionStats),
                    backgroundColor: '#007042',
                    borderRadius: 4,
                  }]
                }}
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false, 
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } },
                    y: { display: false }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}