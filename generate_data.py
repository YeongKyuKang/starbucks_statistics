import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

def scrape_starbucks_strict():
    print("🚀 [수정본] 지역 코드 기반으로 데이터를 정확히 분류합니다...")
    
    # Next.js의 SIDO_CODES와 100% 일치시키는 맵핑 테이블
    # (주소 분석 X, 이 맵핑표를 무조건 따름)
    SIDO_MAP = {
        "01": "서울", "08": "경기", "02": "부산", "03": "대구", "04": "인천",
        "05": "광주", "06": "대전", "07": "울산", "09": "강원", "10": "충북",
        "11": "충남", "12": "전북", "13": "전남", "14": "경북", "15": "경남",
        "16": "제주", "17": "세종"
    }

    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    all_stores = []
    
    try:
        driver.get("https://www.starbucks.co.kr/store/store_map.do")
        time.sleep(3)

        # 지역 검색 탭 클릭
        WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CLASS_NAME, "loca_search"))
        ).click()
        time.sleep(2)

        # 전체 시도 순회
        for sido_cd, sido_name_fixed in SIDO_MAP.items():
            try:
                # 1. 시도 클릭
                driver.execute_script(f"document.querySelector('ul.sido_arae_box li a[data-sidocd=\"{sido_cd}\"]').click();")
                time.sleep(2)
                
                # 2. 전체 클릭 (모든 데이터 로드)
                driver.execute_script("document.querySelector('ul.gugun_arae_box li a[data-guguncd=\"\"]').click();")
                time.sleep(5) 

                store_elements = driver.find_elements(By.CSS_SELECTOR, "#mCSB_3_container ul li.quickResultLstCon")
                
                count = 0
                for store in store_elements:
                    lat = store.get_attribute("data-lat")
                    lng = store.get_attribute("data-long")
                    name = store.get_attribute("data-name")
                    
                    # 주소 가져오기 (구/군 분석용으로만 사용)
                    full_text = store.find_element(By.CSS_SELECTOR, "p.result_details").get_attribute("innerText")
                    addr = full_text.split("\n")[0].strip()
                    
                    # 구/군 추출 (주소의 두 번째 단어)
                    # 예: "서울특별시 강남구..." -> "강남구"
                    parts = addr.split()
                    gugun_name = ""
                    if len(parts) >= 2:
                        gugun_name = parts[1]
                    
                    # 세종시는 구가 없음
                    if sido_cd == "17": 
                        gugun_name = "세종"

                    if lat and lng:
                        all_stores.append({
                            "s_name": name,
                            "lat": lat,
                            "lot": lng,
                            "addr": addr,
                            "sido_name": sido_name_fixed, # ✨ 여기에 무조건 '서울', '경기' 등이 박힘
                            "gugun_name": gugun_name
                        })
                        count += 1
                
                print(f" ✅ {sido_name_fixed} ({sido_cd}): {count}개 수집 및 분류 완료")
                
                # 목록 초기화
                driver.execute_script("document.querySelector('.loca_search a').click();")
                time.sleep(2)

            except Exception as e:
                print(f" ⚠️ 에러 ({sido_cd}): {e}")
                try: driver.execute_script("document.querySelector('.loca_search a').click();") 
                except: pass

        # 저장
        with open('starbucks_data.json', 'w', encoding='utf-8') as f:
            json.dump(all_stores, f, ensure_ascii=False, indent=2)
            
        print(f"\n🎉 [완료] 총 {len(all_stores)}개. 데이터가 정확히 분류되었습니다.")

    finally:
        driver.quit()

if __name__ == "__main__":
    scrape_starbucks_strict()