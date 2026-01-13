'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { MapPin, Coffee, Building2, BookOpen, Warehouse, Car, Search, Filter } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const MapWithNoSSR = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold">전국 스타벅스 정보를 불러오는 중...</p>
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
    } else if (hipCount > 0) {
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
  }, [filteredStores]);

  const handleSidoChange = (sido: string) => {
    setSelectedSido(sido);
    setSelectedGugun('All');
    if (sido === 'All') {
      setMapCenter([36.5, 127.5]); setMapZoom(7);
    } else {
      const target = allStores.find(s => s.sido_name === sido);
      if (target) { setMapCenter([parseFloat(target.lat), parseFloat(target.lot)]); setMapZoom(11); }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-white text-slate-900 overflow-hidden font-sans">
      
      {/* 🎛️ 사이드 패널 */}
      <div className="w-full h-[40%] md:h-full md:w-[380px] bg-white border-b md:border-b-0 md:border-r border-slate-100 flex flex-col z-20 shadow-2xl transition-all">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-green-700 p-2 rounded-xl shadow-lg">
              <Coffee className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              스타벅스 <span className="text-green-700 font-bold underline decoration-4 underline-offset-4 decoration-green-100">입지 분석</span>
            </h1>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1">Location Insight Dashboard</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-10 custom-scrollbar">
          {/* 필터 섹션 */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-xs font-black text-slate-400 flex items-center gap-1.5 uppercase">
                <Filter size={13} /> 지역 설정
              </label>
              <span className="text-[10px] bg-green-50 px-2 py-0.5 rounded-full text-green-700 font-black">
                {filteredStores.length.toLocaleString()} 매장
              </span>
            </div>
            
            <div className="grid gap-3">
              <div className="relative group">
                <select 
                  className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-green-50 focus:border-green-600 outline-none appearance-none transition-all cursor-pointer"
                  value={selectedSido}
                  onChange={(e) => handleSidoChange(e.target.value)}
                >
                  <option value="All">전국 전체</option>
                  {SIDO_CODES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Search className="absolute right-3 top-3.5 text-slate-400 w-4 h-4 pointer-events-none group-hover:text-green-600 transition-colors" />
              </div>
              
              <select 
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-green-50 outline-none appearance-none disabled:opacity-30 transition-all cursor-pointer"
                disabled={selectedSido === 'All'}
                value={selectedGugun}
                onChange={(e) => {
                  setSelectedGugun(e.target.value);
                  const target = allStores.find(s => s.sido_name === selectedSido && s.gugun_name === e.target.value);
                  if (target) { setMapCenter([parseFloat(target.lat), parseFloat(target.lot)]); setMapZoom(13); }
                }}
              >
                <option value="All">시/군/구 전체</option>
                {gugunList.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* AI 추천 카드 */}
          {recommendation && (
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-5 border border-green-500 shadow-xl shadow-green-100 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-125 transition-transform duration-700">
                <Coffee size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                    <span className="text-white">{recommendation.icon}</span>
                  </div>
                  <h3 className="font-black text-white text-lg tracking-tight">{recommendation.type}</h3>
                </div>
                <p className="text-xs text-green-50 leading-relaxed mb-4 font-medium italic">
                  "{recommendation.message}"
                </p>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/20">
                  <p className="text-[11px] font-bold text-white leading-tight">
                    💡 <span className="ml-1 opacity-90">전략: {recommendation.strategy}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 차트 섹션 */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">지역별 분포 점유율</label>
            <div className="h-44 w-full bg-slate-50/50 rounded-3xl p-4 border border-slate-100">
              <Bar 
                data={{
                  labels: Object.keys(regionStats),
                  datasets: [{
                    data: Object.values(regionStats),
                    backgroundColor: '#15803d',
                    borderRadius: 8,
                    barThickness: 16,
                  }]
                }}
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false, 
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' } },
                    y: { display: false }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🗺️ 지도 섹션 */}
      <div className="flex-1 relative h-[60%] md:h-full">
        <MapWithNoSSR stores={filteredStores} center={mapCenter} zoom={mapZoom} />
      </div>
    </div>
  );
}