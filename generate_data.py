import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

def get_sido_from_addr(addr):
    """주소 앞글자를 보고 시/도 이름을 정확히 반환"""
    if addr.startswith("서울"): return "서울"
    if addr.startswith("경기"): return "경기"
    if addr.startswith("부산"): return "부산"
    if addr.startswith("대구"): return "대구"
    if addr.startswith("인천"): return "인천"
    if addr.startswith("광주"): return "광주"
    if addr.startswith("대전"): return "대전"
    if addr.startswith("울산"): return "울산"
    if addr.startswith("세종"): return "세종"
    if addr.startswith("강원"): return "강원"
    if addr.startswith("충북") or addr.startswith("충청북도"): return "충북"
    if addr.startswith("충남") or addr.startswith("충청남도"): return "충남"
    if addr.startswith("전북") or addr.startswith("전라북도"): return "전북"
    if addr.startswith("전남") or addr.startswith("전라남도"): return "전남"
    if addr.startswith("경북") or addr.startswith("경상북도"): return "경북"
    if addr.startswith("경남") or addr.startswith("경상남도"): return "경남"
    if addr.startswith("제주"): return "제주"
    return "기타"

def scrape_starbucks_final_fix():
    print("🚀 [데이터 오류 수정] 주소 기반으로 정확한 데이터를 다시 수집합니다...")
    
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    # 화면 없이 실행하려면 아래 주석 해제
    # chrome_options.add_argument("--headless") 
    
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

        # 1. 서울(01) ~ 세종(17) 순회
        for i in range(1, 18):
            sido_cd = f"{i:02d}"
            
            try:
                # 시도 클릭
                driver.execute_script(f"document.querySelector('ul.sido_arae_box li a[data-sidocd=\"{sido_cd}\"]').click();")
                time.sleep(2)
                
                # 전체 클릭
                driver.execute_script("document.querySelector('ul.gugun_arae_box li a[data-guguncd=\"\"]').click();")
                time.sleep(5) 

                store_elements = driver.find_elements(By.CSS_SELECTOR, "#mCSB_3_container ul li.quickResultLstCon")
                
                count = 0
                for store in store_elements:
                    lat = store.get_attribute("data-lat")
                    lng = store.get_attribute("data-long")
                    name = store.get_attribute("data-name")
                    
                    # 주소 가져오기
                    full_text = store.find_element(By.CSS_SELECTOR, "p.result_details").get_attribute("innerText")
                    addr = full_text.split("\n")[0].strip()
                    
                    # 주소 분석해서 시/도, 구/군 추출
                    parts = addr.split()
                    sido_name = get_sido_from_addr(addr) # 주소보고 직접 판단
                    gugun_name = parts[1] if len(parts) > 1 else ""

                    if lat and lng:
                        all_stores.append({
                            "s_name": name,
                            "lat": lat,
                            "lot": lng,
                            "addr": addr,
                            "sido_name": sido_name,
                            "gugun_name": gugun_name
                        })
                        count += 1
                
                print(f" ✅ 코드 {sido_cd} 완료 -> {count}개 수집")
                
                # 목록 초기화
                driver.execute_script("document.querySelector('.loca_search a').click();")
                time.sleep(2)

            except Exception as e:
                print(f" ⚠️ 에러: {e}")
                try: driver.execute_script("document.querySelector('.loca_search a').click();") 
                except: pass

        # 저장
        with open('starbucks_data.json', 'w', encoding='utf-8') as f:
            json.dump(all_stores, f, ensure_ascii=False, indent=2)
            
        print(f"\n🎉 [수정 완료] 총 {len(all_stores)}개. 이제 부산은 부산으로, 광주는 광주로 정확히 나옵니다!")

    finally:
        driver.quit()

if __name__ == "__main__":
    scrape_starbucks_final_fix()