'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { MapPin, Coffee, Building2, BookOpen, Warehouse, Car, Menu } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const MapWithNoSSR = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">지도를 불러오는 중...</div>
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

  // 데이터 캐싱: 한 번 로드된 데이터는 브라우저 메모리에 유지됨 (React State)
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/starbucks_data.json', { cache: 'force-cache' }); // ✨ 브라우저 캐시 강제 사용
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
    // 데이터 많은 순 정렬
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
  }, [filteredStores, selectedSido]);

  const recommendation = useMemo(() => {
    if (filteredStores.length === 0) return null;

    let univCount = 0;
    let officeCount = 0;
    let hipCount = 0;
    let dtCount = 0;

    filteredStores.forEach(s => {
      const name = (s.s_name || "").toLowerCase();
      const addr = (s.addr || "").toLowerCase();
      
      if (name.includes("univ") || name.includes("대학") || name.includes("학교")) univCount++;
      if (name.includes("타워") || name.includes("파이낸스") || name.includes("삼성") || name.includes("역") || addr.includes("테헤란")) officeCount++;
      if (addr.includes("성수") || addr.includes("가로수") || addr.includes("연남") || addr.includes("이태원")) hipCount++;
      if (name.includes("dt")) dtCount++;
    });

    const total = filteredStores.length;
    let type = "주거/생활 상권";
    let message = "거주민 중심의 안정적인 수요가 예상됩니다.";
    let strategy = "편안한 좌석과 커뮤니티 공간 중심의 매장 구성";
    let icon = <Coffee className="w-5 h-5 text-green-600" />;

    if (univCount / total > 0.05) {
      type = "대학가 (카공족)";
      message = "학업 목적의 장시간 체류 고객이 많습니다.";
      strategy = "1인석 및 콘센트 확보, 스터디존 강화";
      icon = <BookOpen className="w-5 h-5 text-blue-500" />;
    } else if (officeCount / total > 0.3) {
      type = "오피스/비즈니스";
      message = "직장인 유동인구가 폭발적인 지역입니다.";
      strategy = "빠른 회전율, 모바일 오더 픽업존 확대, 미팅룸";
      icon = <Building2 className="w-5 h-5 text-slate-700" />;
    } else if (hipCount > 0 || selectedGugun === '성동구' || selectedGugun === '마포구') {
      type = "핫플레이스";
      message = "트렌드에 민감한 2030 고객 유입이 많습니다.";
      strategy = "인스타그래머블한 인테리어, 특화 MD 상품 배치";
      icon = <Warehouse className="w-5 h-5 text-purple-600" />;
    } else if (dtCount / total > 0.2) {
      type = "교통 요충지 (DT)";
      message = "차량 이동량이 많아 DT 수요가 높습니다.";
      strategy = "차량 동선 최적화 및 대기 공간 확보";
      icon = <Car className="w-5 h-5 text-red-500" />;
    }

    return { type, message, strategy, icon, count: total };
  }, [filteredStores, selectedGugun, selectedSido]);

  const handleSidoChange = (sido: string) => {
    setSelectedSido(sido);
    setSelectedGugun('All');
    
    if (sido === 'All') {
      setMapCenter([36.5, 127.5]);
      setMapZoom(7);
    } else {
      const target = allStores.find(s => s.sido_name === sido);
      if (target) {
        setMapCenter([parseFloat(target.lat), parseFloat(target.lot)]);
        setMapZoom(10);
      }
    }
  };

  const handleGugunChange = (gugun: string) => {
    setSelectedGugun(gugun);
    const target = allStores.find(s => s.sido_name === selectedSido && s.gugun_name === gugun);
    if (target) {
      setMapCenter([parseFloat(target.lat), parseFloat(target.lot)]);
      setMapZoom(13);
    }
  };

  return (
    // 📱 모바일: 세로 배치 (flex-col), 💻 PC: 가로 배치 (md:flex-row)
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* 🗺️ 지도 영역 (모바일: 위쪽 55%, PC: 오른쪽 나머지 전체) */}
      <div className="w-full h-[55%] md:h-full md:flex-1 relative order-1 md:order-2 z-0">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-semibold text-green-800">데이터 로딩중...</span>
            </div>
          </div>
        )}
        <MapWithNoSSR stores={filteredStores} center={mapCenter} zoom={mapZoom} />
        
        {/* 모바일용 오버레이 타이틀 */}
        <div className="absolute top-4 left-4 right-4 z-[400] md:hidden pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50 flex items-center gap-2 pointer-events-auto">
            <Coffee className="text-green-700 w-5 h-5" />
            <div>
              <h1 className="text-sm font-bold text-slate-800">스타벅스 입지 분석</h1>
              <p className="text-[10px] text-slate-500">전국 {allStores.length}개 매장 데이터</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🎛️ 컨트롤 패널 (모바일: 아래쪽 45%, PC: 왼쪽 400px 고정) */}
      <div className="w-full h-[45%] md:h-full md:w-[400px] bg-white border-t md:border-t-0 md:border-r border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:shadow-xl z-10 flex flex-col order-2 md:order-1">
        
        {/* PC용 헤더 */}
        <div className="hidden md:block p-6 border-b border-slate-100 bg-white sticky top-0">
          <h1 className="text-2xl font-extrabold text-green-700 flex items-center gap-2">
            <Coffee className="stroke-[2.5px]" /> 
            Starbucks Insight
          </h1>
          <p className="text-xs text-slate-400 mt-1 ml-9">Location Intelligence Dashboard</p>
        </div>

        {/* 스크롤 가능한 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* 1. 필터 섹션 */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={12} /> 지역 필터
              </h2>
              <span className="text-[10px] font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {filteredStores.length}개 매장
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select 
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none"
                value={selectedSido}
                onChange={(e) => handleSidoChange(e.target.value)}
              >
                <option value="All">전국 전체</option>
                {SIDO_CODES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              
              <select 
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none disabled:opacity-50"
                disabled={selectedSido === 'All'}
                value={selectedGugun}
                onChange={(e) => handleGugunChange(e.target.value)}
              >
                <option value="All">전체 구/군</option>
                {gugunList.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </section>

          {/* 2. 통계 차트 (모바일에서는 작게) */}
          <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">매장 분포 현황</h2>
            <div className="h-28 md:h-36 w-full bg-slate-50 rounded-lg p-2 border border-slate-100">
               <Bar 
                 data={{
                   labels: Object.keys(regionStats).slice(0, 5), 
                   datasets: [{
                     data: Object.values(regionStats).slice(0, 5),
                     backgroundColor: '#15803d',
                     borderRadius: 3,
                     barThickness: 16,
                   }]
                 }}
                 options={{ 
                   responsive: true,
                   maintainAspectRatio: false, 
                   plugins: { legend: { display: false } },
                   scales: {
                     x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                     y: { display: false }
                   }
                 }}
               />
            </div>
          </section>

          {/* 3. AI 분석 리포트 (핵심) */}
          {recommendation && (
            <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">AI 분석</span>
                <h3 className="font-bold text-sm text-slate-800">{recommendation.type}</h3>
              </div>
              
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-white rounded-lg shadow-sm text-green-600 shrink-0">
                  {recommendation.icon}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 leading-snug">
                    {recommendation.message}
                  </p>
                  <div className="bg-white/60 p-2 rounded-lg border border-green-100/50">
                    <p className="text-[11px] font-medium text-green-800 leading-snug">
                      💡전략: {recommendation.strategy}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}