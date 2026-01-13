'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { MapPin, Coffee, Building2, BookOpen, Warehouse, Car } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const MapWithNoSSR = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">지도를 불러오는 중...</div>
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
        const res = await fetch('/starbucks_data.json');
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

  // 1. 필터링 로직 (이제 정확한 name으로 비교합니다)
  const filteredStores = useMemo(() => {
    return allStores.filter(store => {
      const matchSido = selectedSido === 'All' || store.sido_name === selectedSido;
      const matchGugun = selectedGugun === 'All' || store.gugun_name === selectedGugun;
      return matchSido && matchGugun;
    });
  }, [allStores, selectedSido, selectedGugun]);

  // 2. 구군 목록 생성 (선택된 시도에 있는 구군만 추출)
  const gugunList = useMemo(() => {
    if (selectedSido === 'All') return [];
    // 해당 시도의 모든 구군을 뽑아서 중복 제거 및 정렬
    const guguns = new Set(allStores
      .filter(s => s.sido_name === selectedSido)
      .map(s => s.gugun_name)
      .filter(Boolean) // 빈 값 제거
    );
    return Array.from(guguns).sort();
  }, [allStores, selectedSido]);

  // 3. 지역별 통계
  const regionStats = useMemo(() => {
    const counts: {[key: string]: number} = {};
    filteredStores.forEach(s => {
      // 전국일 땐 시도별, 특정 시도일 땐 구군별 통계
      const key = selectedSido === 'All' ? s.sido_name : s.gugun_name;
      if(key) counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [filteredStores, selectedSido]);

  // 4. ✨ 핵심: 입지 분석 및 추천 로직 강화
  const recommendation = useMemo(() => {
    if (filteredStores.length === 0) return null;

    let univCount = 0;
    let officeCount = 0;
    let hipCount = 0;
    let dtCount = 0;

    // 현재 선택된 지역의 매장들을 전수 조사
    filteredStores.forEach(s => {
      const name = (s.s_name || "").toLowerCase();
      const addr = (s.addr || "").toLowerCase();
      
      if (name.includes("univ") || name.includes("대학") || name.includes("학교")) univCount++;
      if (name.includes("타워") || name.includes("파이낸스") || name.includes("삼성") || name.includes("역") || addr.includes("테헤란")) officeCount++;
      if (addr.includes("성수") || addr.includes("가로수") || addr.includes("연남") || addr.includes("이태원")) hipCount++;
      if (name.includes("dt")) dtCount++;
    });

    const total = filteredStores.length;
    
    // 분석 결과 도출
    let type = "주거 및 생활 상권";
    let message = "다양한 연령층이 거주하며 안정적인 수요가 있는 지역입니다.";
    let strategy = "편안한 좌석 배치, 커뮤니티 테이블 중심의 '제3의 공간' 전략";
    let icon = <Coffee className="w-6 h-6 text-green-600" />;

    // 비율로 판단 (가장 강력한 특징 하나를 선정)
    if (univCount / total > 0.05) { // 대학가 비율이 조금만 높아도 특징적임
      type = "대학가 (카공족/MZ)";
      message = "학업 및 모임 목적의 장시간 체류 고객이 많습니다.";
      strategy = "콘센트 확보, 1인 집중석 및 스터디 그룹용 테이블 비중 확대";
      icon = <BookOpen className="w-6 h-6 text-blue-500" />;
    } else if (officeCount / total > 0.3) {
      type = "오피스/비즈니스";
      message = "출근/점심 시간대 직장인 트래픽이 폭발적인 곳입니다.";
      strategy = "모바일 오더 픽업존 확대, 빠른 회전율을 위한 동선, 소규모 미팅룸";
      icon = <Building2 className="w-6 h-6 text-slate-700" />;
    } else if (hipCount > 0 || selectedGugun === '성동구' || selectedGugun === '마포구') {
      type = "트렌드/핫플레이스";
      message = "외부 유입 인구와 트렌드에 민감한 고객층이 주를 이룹니다.";
      strategy = "인스타그래머블한 인테리어, 특화 음료/MD 배치, 팝업 스토어 형태";
      icon = <Warehouse className="w-6 h-6 text-purple-600" />;
    } else if (dtCount / total > 0.2) {
      type = "교통 요충지 (DT)";
      message = "차량 이동량이 많아 드라이브 스루 수요가 높습니다.";
      strategy = "DT 라인 확보 및 차량 대기 공간 최적화, 대형 사이니지";
      icon = <Car className="w-6 h-6 text-red-500" />;
    }

    return { type, message, strategy, icon, count: total };
  }, [filteredStores, selectedGugun, selectedSido]);

  // 지도 이동 핸들러
  const handleSidoChange = (sido: string) => {
    setSelectedSido(sido);
    setSelectedGugun('All');
    
    if (sido === 'All') {
      setMapCenter([36.5, 127.5]);
      setMapZoom(7);
    } else {
      // 해당 시도의 첫 번째 매장 좌표로 이동
      const target = allStores.find(s => s.sido_name === sido);
      if (target) {
        setMapCenter([parseFloat(target.lat), parseFloat(target.lot)]);
        setMapZoom(11);
      }
    }
  };

  const handleGugunChange = (gugun: string) => {
    setSelectedGugun(gugun);
    // 해당 구군의 첫 번째 매장 좌표로 이동
    const target = allStores.find(s => s.sido_name === selectedSido && s.gugun_name === gugun);
    if (target) {
      setMapCenter([parseFloat(target.lat), parseFloat(target.lot)]);
      setMapZoom(13);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <div className="w-[400px] flex-shrink-0 h-full overflow-y-auto bg-white border-r border-slate-200 shadow-xl z-20 flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h1 className="text-2xl font-extrabold text-green-700 flex items-center gap-2 tracking-tight">
            <Coffee className="stroke-[2.5px]" /> 
            Starbucks Insight
          </h1>
          <p className="text-xs text-slate-400 mt-1 ml-9">Location Intelligence Dashboard</p>
        </div>

        <div className="p-6 space-y-8">
          {/* 1. Filter Section */}
          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin size={14} /> Region Filter
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <select 
                className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                value={selectedSido}
                onChange={(e) => handleSidoChange(e.target.value)}
              >
                <option value="All">전국 전체</option>
                {SIDO_CODES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              
              <select 
                className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedSido === 'All'}
                value={selectedGugun}
                onChange={(e) => handleGugunChange(e.target.value)}
              >
                <option value="All">전체 구/군</option>
                {gugunList.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </section>

          {/* 2. Stats Section */}
          <section>
            <div className="flex justify-between items-end mb-3">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Store Distribution</h2>
              <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Total: {filteredStores.length}
              </span>
            </div>
            <div className="h-40 w-full">
               <Bar 
                 data={{
                   labels: Object.keys(regionStats).slice(0, 7), // 공간 관계상 상위 7개만
                   datasets: [{
                     data: Object.values(regionStats).slice(0, 7),
                     backgroundColor: '#15803d',
                     borderRadius: 4,
                     barThickness: 20,
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

          {/* 3. AI Insight Section (Highlight) */}
          {recommendation && (
            <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    AI Recommendation
                  </span>
                </div>
                
                <div className="flex items-start gap-4 mb-5">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-green-100 text-green-600">
                    {recommendation.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">
                      {recommendation.type}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {recommendation.message}
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-green-100/50">
                  <h4 className="text-xs font-bold text-green-800 uppercase mb-2">Strategic Focus</h4>
                  <p className="text-sm text-slate-700 leading-snug font-medium">
                    "{recommendation.strategy}"
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-400">
          Powered by Next.js & Selenium Analysis
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-slate-200">
        {loading && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="font-bold text-slate-700">Loading Stores...</span>
            </div>
          </div>
        )}
        <MapWithNoSSR stores={filteredStores} center={mapCenter} zoom={mapZoom} />
      </div>
    </div>
  );
}