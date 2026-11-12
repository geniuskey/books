/* 분야별 개념 묶음과 연결. 책의 집필 순서와는 독립적인 탐색 지도입니다.
   서가가 지도를 가진 분야는 data/books.json의 fields[].stages·map을 쓰고, 여기에는 허브 전용 값(regions, 추가 연결)만 둡니다. */
window.FIELD_MAPS = {
  // science: 지도는 science-books의 catalog.json(map)에서 빌드가 만든 shelf.json을 거쳐 tools/sync-books.py로 data/books.json에 온다.
  // math: 지도는 math-books의 book.json(map)에서 tools/sync-books.py로 data/books.json에 옵니다.
  math: {
    regions: [[12, 12, 1], [268, 12, 3], [998, 12, 1]],
  },
  math: {
    regions: [[12, 12, 1], [268, 12, 3], [998, 12, 1]],
  },
  // construction: 지도는 construction-books의 book.json(map)에서 tools/sync-books.py로 data/books.json에 옵니다.
  // semiconductor: 지도는 semi-books의 book.json(map)에서 tools/sync-books.py로 data/books.json에 옵니다.
  semiconductor: {
    // [왼쪽, 위, 열 수]. 좌표는 읽는 순서가 아닌 주제의 이웃 관계를 표현합니다.
    regions: [[12, 12, 1], [268, 12, 2], [12, 286, 3], [742, 386, 1], [742, 12, 2], [998, 386, 1]],
  },
  // computing: 지도는 computing-books의 book.json(map)에서 tools/sync-books.py로 data/books.json에 옵니다.
  // electronics: 묶음과 서가 안 연결은 서가 지도(system-books)에서 tools/sync-books.py로 data/books.json에 온다.
  // 여기에는 여러 서가를 아우르는 제목·설명과 서가 밖 책의 연결만 둔다.
  electronics: {
    title: "회로에서 움직이는 시스템까지",
    desc: "전기 신호가 연결되고 제어되어 일상의 기기와 이동 수단이 됩니다.",
    links: [
      ["electricbook", "phonebook", "회로가 모여 스마트폰이 되기까지"],
      ["electricbook", "carbook", "전압·전류·회로로 자동차 전장과 전원 이해하기"],
      ["electricbook", "shipbook", "전압·전류·회로로 선박 전기 시스템 이해하기"],
    ],
  },
  // money: 지도는 money-books의 book.json(map)에서 tools/sync-books.py로 data/books.json에 옵니다.
  money: {
    // [왼쪽, 위, 열 수]. 서가 묶음 순서(돈과 경제 → 투자·집 → 세금·보험)를 따릅니다.
    regions: [[12, 12, 2], [504, 12, 2], [12, 210, 2]],
  },
  money: {
    // MoneyBooks 서가의 분야 구분(돈과 경제 → 투자·집 → 세금·보험)을 따릅니다.
    regions: [[12, 12, 2], [504, 12, 2], [12, 210, 2]],
  },
  // health: 지도는 medical-books의 book.json(map)에서 tools/sync-books.py로 data/books.json에 옵니다.
  // culture: 묶음과 서가 안 연결은 서가 지도(music-books·art-books)에서 tools/sync-books.py로 data/books.json에 온다.
  // 여기에는 여러 서가를 아우르는 제목·설명과 서가 밖 책의 연결만 둔다.
  culture: {
    title: "세상을 이해하고 표현하는 방법",
    desc: "음악에서 미술과 시각 표현, 웹·제품·산업디자인까지.",
  },
};

// 분야를 넘는 연결도 한 번만 등록합니다. 양쪽 책의 소개에서 같은 이유로 탐색합니다.
window.FIELD_MAP_CROSS_LINKS = [
  ["electromagnetics", "powerbook", "기생 인덕턴스·자기 소자와 스위칭 과도"],
  ["thermal-physics", "powerbook", "열저항·열 확산과 전력 소자의 접합 온도"],
  ["electromagnetics", "devicebook", "정전계·경계 조건으로 이해하는 소자의 전위와 전기장"],
  ["materials-science", "processbook", "결정·확산·상변태와 반도체 공정의 재료 변화"],
  ["electromagnetics", "plasmabook", "전자기장과 하전 입자의 운동·방전"],
  ["thermal-physics", "thinfilmbook", "기체 운동론·확산과 진공·열산화·증착 수송"],
  ["general-chemistry", "thinfilmbook", "반응 속도론·흡착으로 이해하는 CVD·ALD 표면 반응"],
  ["materials-science", "thinfilmbook", "핵생성·결정립·응력으로 이해하는 막의 미세조직과 막질"],
  ["thermal-physics", "infrabook", "에너지 수지·열기관과 팹의 냉동·냉각 설비"],
  ["modern-physics", "devicebook", "양자 우물·터널링·에너지 띠에서 반도체 소자 물리로"],
  ["solid-state", "devicebook", "캐리어 통계·수송·재결합과 접합에서 소자 동작으로"],
  ["probability-statistics", "thermal-physics", "확률 분포에서 볼츠만 분포와 통계역학으로"],
  ["mathbook", "musicbook", "푸리에·표본화·수의 비율로 음색과 조율 이해하기"],
  ["linearbook", "aibook", "행렬 곱·SVD·PCA와 신경망의 표현·차원 축소"],
  ["odebook", "electricbook", "RLC 회로의 2계 방정식·라플라스 변환과 과도 응답"],
  ["numericalbook", "tcadbook", "이산화·뉴턴 반복·희소 행렬 해법과 소자 시뮬레이션"],
  ["probability-statistics", "yieldbook", "통계적 공정 관리·신뢰성 분포로 읽는 수율과 불량"],
  ["general-physics", "mechanicsbook", "힘·토크·평형에서 구조물의 반력과 단면력으로"],
  ["linearbook", "mechanicsbook", "연립방정식·행렬과 매트릭스 구조해석의 강성법"],
  ["general-chemistry", "materialsbook", "시멘트 수화 반응과 철근 부식의 전기화학"],
  ["materials-science", "materialsbook", "결함·소성·파괴·부식의 원리와 강재·콘크리트의 거동"],
  ["fluid-mechanics", "geotechbook", "다르시 법칙·침투 유동과 흙의 투수"],
  ["calculusbook", "mechanicsbook", "적분으로 구하는 단면 성질과 처짐 곡선"],
  ["odebook", "structurebook", "1자유도 진동·감쇠·공진과 구조 동역학·내진 응답"],
  ["numericalbook", "structurebook", "이산화·고유값 계산과 구조 해석 모델·모드 해석"],
  ["fluid-mechanics", "civilbook", "개수로 흐름과 도로 배수·하천 수공 구조물"],
  ["probability-statistics", "sitebook", "확률 분포로 읽는 PERT 공기 위험과 품질 관리"],
  ["general-chemistry", "processbook", "반응·평형·속도론으로 이해하는 제조 공정"],
  ["general-chemistry", "cmpbook", "산화·착화·pH와 제타 전위로 이해하는 슬러리와 세정액"],
  ["fluid-mechanics", "infrabook", "관 유동·압력 손실과 팹의 공조·용수 공급"],
  ["electricbook", "analogbook", "전압·전류·커패시터의 기초에서 증폭·필터 회로로"],
  ["powerbook", "carbook", "전력 반도체와 전기차의 인버터·모터 구동"],
  ["socbook", "gpubook", "SoC의 GPU 블록에서 SIMT 실행·병렬 처리로"],
  ["memorybook", "gpubook", "병렬 연산을 제한하는 메모리 계층과 대역폭"],
  ["socbook", "aibook", "SoC의 NPU와 신경망 추론·양자화"],
  ["mathbook", "networkbook", "표본화·정보 이론과 통신 신호·대역폭"],
  ["mathbook", "electricbook", "복소수·미분방정식으로 이해하는 교류와 회로 응답"],
  ["computerbook", "digitalbook", "논리 게이트·순차 회로에서 CPU를 구성하는 회로로"],
  ["computerbook", "socbook", "CPU·캐시의 기초에서 SoC 내부 구조로"],
  ["computerbook", "memorybook", "메모리 계층·가상 메모리·저장장치와 실제 DRAM·SSD"],
  ["memorybook", "aibook", "HBM·메모리 대역폭과 모델·KV 캐시의 메모리 요구량"],
  ["networkbook", "analogbook", "SerDes·통신 회로의 ADC·PLL·잡음"],
  ["networkbook", "opticsbook", "광섬유·실리콘 포토닉스와 빛의 전파·간섭"],
  ["networkbook", "phonebook", "스마트폰의 안테나·RF와 Wi-Fi·이동통신"],
  ["socbook", "phonebook", "스마트폰 AP의 연산·전력·열 설계"],
  ["sensorbook", "phonebook", "이미지 센서와 스마트폰 카메라 모듈"],
  ["displaybook", "phonebook", "OLED·LTPO와 스마트폰 화면의 전력·화질"],
  ["sensorbook", "carbook", "차량용 이미지 센서와 ADAS의 주변 인식"],
  ["aibook", "carbook", "학습 모델과 자율주행의 인식·판단"],
  ["opticsbook", "camerabook", "렌즈·수차·회절과 초점·조리개·화질"],
  ["sensorbook", "camerabook", "픽셀·노이즈·셔터와 사진의 노출·ISO·RAW"],
  ["colorbook", "displaybook", "색공간·색역·HDR와 디스플레이 색 재현"],
  ["colorbook", "sensorbook", "센서의 색 응답·ISP와 카메라 색 관리"],
  ["colorbook", "camerabook", "화이트 밸런스·색공간과 RAW 색 보정"],
  ["colorbook", "artbook-color", "측색·색공간과 지각·배색의 관계"],
  ["colorbook", "phonebook", "화면에서 빛과 색 재현하기"],
  ["camerabook", "artbook-image", "촬영의 원리에서 이미지 표현으로"],
  ["camerabook", "artbook-composition", "촬영 프레임·자르기와 시선의 흐름"],
  ["camerabook", "artbook-color", "화이트 밸런스·색 보정과 색의 대비·조화"],
  ["mathbook", "aibook", "벡터·행렬·최적화와 신경망 학습"],
  ["mathbook", "statbook", "확률·기댓값에서 표본과 통계적 판단으로"],
  ["mathbook", "opticsbook", "푸리에·표본화와 회절·광학 해상도"],
  ["mathbook", "tcadbook", "이산화·비선형 방정식·수치 해석과 소자 시뮬레이션"],
  ["statbook", "yieldbook", "결함 확률·표본·통계로 수율 데이터 해석하기"],
  ["statbook", "artbook-product", "사용성 지표·A/B 테스트와 통계적 판단"],
  ["chipindustrybook", "economicsbook", "설비 투자·공급 지연·경기 순환과 반도체 사이클"],
  ["chipindustrybook", "stockbook", "반도체 기업의 사업 구조·업황과 재무·가치평가"],
  ["bodybook", "artbook-drawing", "근육·몸의 구조와 인체 표현"],
  ["bodybook", "artbook-industrial", "몸의 움직임과 제품의 인간공학"],
  ["phonebook", "artbook-industrial", "기구·재료·조립·방열과 제품 설계"],
];
