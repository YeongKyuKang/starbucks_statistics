import { NextResponse } from 'next/server';

// 동적 임포트 (빌드 에러 방지)
let chromium: any;
let puppeteer: any;

if (process.env.NODE_ENV === 'production') {
  // Vercel 배포 환경
  chromium = require('@sparticuz/chromium');
  puppeteer = require('puppeteer-core');
} else {
  // 로컬 개발 환경
  puppeteer = require('puppeteer-core');
  // 로컬에서는 크롬 경로를 지정하거나 puppeteer full 버전을 devDependencies로 써야 함
  // 편의상 로컬 테스트용 설정을 아래에 포함
}

export async function POST(request: Request) {
  const body = await request.json();
  const { sido_cd } = body;

  try {
    let browser;
    
    if (process.env.NODE_ENV === 'production') {
      // 🚀 Vercel 배포 환경 설정
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
    } else {
      // 💻 로컬 개발 환경 설정 (Chrome이 설치된 경로 필요)
      // 윈도우/맥에 따라 경로가 다름. 로컬 테스트 땐 그냥 'puppeteer'를 쓰는 게 나을 수 있음
      // 여기서는 팁으로 로컬 크롬 경로 예시를 듭니다.
      const localExePath = process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

      browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        executablePath: localExePath, // 본인 PC 크롬 경로 확인 필요
        headless: true,
      });
    }

    const page = await browser.newPage();
    
    // 봇 탐지 회피 (User-Agent)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 지도 페이지 접속 (세션 획득)
    await page.goto('https://www.starbucks.co.kr/store/store_map.do', { waitUntil: 'networkidle2' });

    // 브라우저 내부에서 데이터 요청 (Fetch)
    const storeData = await page.evaluate(async (code: string) => {
        try {
            const formData = new URLSearchParams();
            formData.append('p_sido_cd', code); 
            // ... 나머지 필수 파라미터들은 사이트 스크립트가 자동 처리하거나 아래처럼 추가
            formData.append('in_biz_cds', '0');
            formData.append('in_scodes', '0');
            formData.append('ins_lat', '37.5665');
            formData.append('ins_lng', '126.9780');
            formData.append('search_text', '');
            formData.append('p_gugun_cd', '');
            formData.append('isError', 'true');
            formData.append('in_distance', '0');
            formData.append('in_biz_cd', '');
            formData.append('new_bool', '0');
            formData.append('whcroad_yn', '0');
            formData.append('sexn_use_yn', '0');
            formData.append('biz_cat_cd', '');
            formData.append('biz_cat_chk', '');
            formData.append('p_grad_cd', '0');
            formData.append('s_code', '');
            formData.append('s_sido_cd', '');
            formData.append('s_gugun_cd', '');
            formData.append('rndCod', 'V0K7O7');

            const res = await fetch('https://www.starbucks.co.kr/store/getStore.do', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            return await res.json();
        } catch (err) {
            return { error: true };
        }
    }, sido_cd);

    await browser.close();
    return NextResponse.json(storeData);

  } catch (error) {
    console.error('Puppeteer Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}