/* 분야별 개념 묶음과 연결. 책의 집필 순서와는 독립적인 탐색 지도입니다. */
window.FIELD_MAPS = {
  semiconductor: {
    title: "전자 하나에서 산업 전체까지",
    desc: "원리에서 설계·제조로, 완성된 칩에서 제품과 산업으로 이어집니다.",
    // [왼쪽, 위, 열 수]. 좌표는 읽는 순서가 아닌 주제의 이웃 관계를 표현합니다.
    regions: [[12, 12, 1], [268, 12, 2], [12, 286, 3], [742, 386, 1], [742, 12, 2], [998, 386, 1]],
    links: [
      ["devicebook", "digitalbook", "소자에서 논리 회로로"],
      ["devicebook", "analogbook", "소자의 특성을 회로에 활용하기"],
      ["devicebook", "processbook", "소자 구조를 실제로 만들기"],
      ["devicebook", "tcadbook", "소자의 동작을 수치로 해석하기"],
      ["opticsbook", "sensorbook", "빛의 원리에서 이미지 센서로"],
      ["digitalbook", "designbook", "논리 회로에서 칩 설계로"],
      ["designbook", "socbook", "설계한 블록을 시스템으로 통합하기"],
      ["socbook", "memorybook", "캐시·DRAM 컨트롤러와 메모리 타이밍·대역폭"],
      ["socbook", "gpubook", "SoC의 GPU 블록에서 SIMT 실행·병렬 처리로"],
      ["analogbook", "sensorbook", "센서 신호를 읽는 회로"],
      ["processbook", "lithobook", "회로 패턴을 웨이퍼에 옮기기"],
      ["processbook", "etchbook", "필요한 형상을 깎아 만들기"],
      ["processbook", "dopingbook", "불순물로 전기적 특성 바꾸기"],
      ["processbook", "yieldbook", "공정 결과를 수율로 읽기"],
      ["yieldbook", "failurebook", "수율 손실에서 불량 원인으로"],
      ["processbook", "packagingbook", "웨이퍼에서 연결된 칩으로"],
      ["packagingbook", "testbook", "연결한 칩의 동작 검사하기"],
      ["memorybook", "packagingbook", "메모리를 연결하고 쌓기"],
      ["sensorbook", "displaybook", "센서의 색 신호와 디스플레이의 색역·재현"],
      ["devicebook", "powerbook", "전력을 다루는 소자"],
      ["testbook", "chipindustrybook", "패키징·테스트를 맡는 OSAT와 테스트 비용"],
      ["memorybook", "processbook", "DRAM·3D NAND의 셀 구조와 제조 공정"],
      ["memorybook", "designbook", "메모리 주변 회로의 설계·타이밍·배치"],
      ["opticsbook", "yieldbook", "광학 검사의 분해능·산란과 결함 검출"],
      ["lithobook", "yieldbook", "노광 공정 윈도·확률적 결함과 수율"],
      ["packagingbook", "failurebook", "접합·열·응력에 의한 패키지 불량과 분석"],
      ["memorybook", "chipindustrybook", "DRAM·NAND·HBM의 기술 차이와 메모리 시장·공급 사이클"],
      ["designbook", "chipindustrybook", "EDA·IP와 팹리스의 설계 가치사슬"],
      ["processbook", "chipindustrybook", "공정 기술과 장비·소재·파운드리의 역할"],
      ["packagingbook", "chipindustrybook", "첨단 패키징·HBM 공급망과 OSAT의 역할"],
      ["yieldbook", "chipindustrybook", "수율이 양품 칩의 원가와 생산 능력에 미치는 영향"],
      ["designbook", "processbook", "표준 셀·배선·마스크를 실제 공정 단면으로 구현하기"],
      ["designbook", "lithobook", "마스크·OPC와 인쇄 가능한 패턴의 조건"],
      ["designbook", "testbook", "설계 단계의 스캔·DFT와 제조 후 테스트"],
      ["devicebook", "memorybook", "MOS 소자에서 SRAM·DRAM·플래시 셀로"],
      ["devicebook", "sensorbook", "광흡수·포토다이오드에서 픽셀의 전하 수집으로"],
      ["devicebook", "dopingbook", "도핑 농도·접합 깊이가 소자 특성에 미치는 영향"],
      ["digitalbook", "memorybook", "SRAM 셀의 읽기·쓰기와 메모리 배열"],
      ["processbook", "tcadbook", "공정 레시피를 모사해 구조와 전기 특성 예측하기"],
      ["dopingbook", "tcadbook", "이온 주입·확산·활성화의 공정 조건과 수치 모사"],
      ["opticsbook", "lithobook", "회절·해상도·초점으로 이해하는 노광 한계"],
      ["opticsbook", "displaybook", "편광·박막·광학계로 이해하는 LCD·OLED·XR"],
      ["lithobook", "etchbook", "레지스트 패턴을 식각 형상으로 전사하기"],
      ["testbook", "failurebook", "전기적 불량 검출·진단에서 물리적 원인 분석으로"],
      ["testbook", "yieldbook", "웨이퍼 테스트·빈 분류 결과를 수율과 맵으로 해석하기"],
      ["memorybook", "testbook", "메모리 BIST·불량 검출·신뢰성 평가"],
      ["memorybook", "etchbook", "3D NAND의 깊은 채널 홀과 고종횡비 식각"],
      ["memorybook", "gpubook", "병렬 연산을 제한하는 메모리 계층과 대역폭"],
      ["socbook", "sensorbook", "센서의 RAW 신호를 SoC의 ISP에서 처리하기"],
      ["socbook", "analogbook", "SoC의 클럭·전원에 쓰이는 PLL·LDO"],
    ],
  },
  computing: {
    "title": "컴퓨터의 원리에서 데이터와 AI 활용까지",
    "desc": "컴퓨터와 네트워크의 원리에서 데이터 분석, 신경망과 AI의 업무 활용까지.",
    "links": [
      ["computerbook", "osbook", "하드웨어 위에서 프로그램 실행하기"],
      ["computerbook", "networkbook", "한 대의 컴퓨터에서 연결된 컴퓨터로"],
      ["osbook", "databasebook", "프로그램과 데이터의 저장·관리"],
      ["networkbook", "databasebook", "네트워크로 접근하는 데이터베이스와 통신 지연"],
      ["statbook", "aibook", "데이터의 불확실성에서 모델 학습으로"],
      ["aibook", "axbook", "학습한 모델을 실제 업무에 적용하기"],
      ["statbook", "axbook", "실험과 측정으로 도입 효과 판단하기"],
      ["computerbook", "aibook", "CPU·GPU의 연산과 메모리 위에서 신경망 실행하기"],
      ["databasebook", "axbook", "업무 데이터의 저장 구조와 기준정보·데이터 정리"],
      ["databasebook", "aibook", "검색·인덱스와 RAG의 지식 검색"],
      ["networkbook", "aibook", "데이터센터 네트워크와 분산 학습의 통신 병목"],
    ],
    "groups": [
      [
        "컴퓨터의 기초",
        "Foundation",
        "하드웨어와 운영체제가 프로그램을 실행하는 원리",
        [
          "computerbook",
          "osbook"
        ]
      ],
      [
        "연결과 운영",
        "Connect",
        "데이터를 저장하고 시스템을 연결하기",
        [
          "networkbook",
          "databasebook"
        ]
      ],
      [
        "수학·데이터",
        "Foundation",
        "표본과 불확실성, 실험 설계로 데이터를 해석하기",
        [
          "statbook"
        ]
      ],
      [
        "학습과 모델",
        "Learning",
        "머신러닝에서 신경망·언어 모델까지",
        [
          "aibook"
        ]
      ],
      [
        "조직과 업무에 적용",
        "Apply",
        "데이터·프로세스·목표를 정리해 AI를 업무에 정착시키기",
        [
          "axbook"
        ]
      ]
    ]
  },
  electronics: {
    title: "회로에서 움직이는 시스템까지",
    desc: "전기 신호가 연결되고 제어되어 일상의 기기와 이동 수단이 됩니다.",
    links: [
      ["electricbook", "phonebook", "회로가 모여 스마트폰이 되기까지"],
      ["electricbook", "carbook", "전압·전류·회로로 자동차 전장과 전원 이해하기"],
      ["electricbook", "shipbook", "전압·전류·회로로 선박 전기 시스템 이해하기"],
      ["colorbook", "phonebook", "화면에서 빛과 색 재현하기"],
      ["carbook", "shipbook", "전동 추진·에너지 관리와 자율 이동 시스템 비교"],
      ["phonebook", "carbook", "배터리 관리·열 설계의 기기별 제약 비교"],
    ],
    groups: [
      ["회로와 전기", "Circuits", "전자 기기를 이루는 회로의 기본 원리", ["electricbook"]],
      ["빛과 색", "Color", "빛을 측정하고 기기에서 색을 재현하는 원리", ["colorbook"]],
      ["기기와 이동 수단", "Systems", "스마트폰·자동차·선박의 작동 방식", ["phonebook", "carbook", "shipbook"]],
    ],
  },
  money: {
    regions: [[12, 12, 2], [504, 12, 2], [12, 210, 1], [268, 210, 1]],
    "title": "돈의 흐름에서 내 집 마련까지",
    "desc": "돈과 경제, 투자·보험·세금에서 집값과 전월세, 내 집 마련까지.",
    "links": [
      ["moneybook", "economicsbook", "일상의 돈에서 경제 전체로"],
      ["economicsbook", "stockbook", "경제의 흐름과 기업·주식"],
      ["moneybook", "insurebook", "돈의 계획에 위험 대비 더하기"],
      ["moneybook", "taxbook", "벌고 쓰는 돈에 붙는 세금"],
      ["stockbook", "taxbook", "투자 수익과 세금"],
      ["moneybook", "estatebook", "금리와 대출로 주거 계획 세우기"],
      ["moneybook", "stockbook", "자산배분의 기초에서 주식·ETF의 위험과 수익으로"],
      ["economicsbook", "estatebook", "금리·신용·공급의 시차가 주택시장에 미치는 영향"],
      ["estatebook", "taxbook", "주택 거래·보유·양도 세금과 과세·공제의 기본 원리"],
    ],
    "groups": [
      [
        "돈과 경제",
        "Understand",
        "금리·물가·경제 뉴스의 기본 언어",
        [
          "moneybook",
          "economicsbook"
        ]
      ],
      [
        "투자와 위험 대비",
        "Manage",
        "투자하는 돈과 위험에 대비하는 돈",
        [
          "stockbook",
          "insurebook"
        ]
      ],
      [
        "세금",
        "Tax",
        "월급·투자·상속에 붙는 세금과 연말정산",
        [
          "taxbook"
        ]
      ],
      [
        "집값과 주거",
        "Living",
        "집값의 원리, 전월세 계약과 보증금, 대출·세금과 내 집 마련",
        [
          "estatebook"
        ]
      ]
    ]
  },
  health: {
    title: "몸을 이해하고 일상을 돌보기",
    desc: "심장·폐·근육·호르몬의 작동과 연결을 배우며 몸의 원리를 이해합니다.",
    groups: [
      ["몸의 원리", "Understand", "우리 몸의 구조와 작동 방식", ["bodybook"]],
    ],
  },
  culture: {
    "title": "세상을 이해하고 표현하는 방법",
    "desc": "사진·음악·수학에서 미술과 시각 표현, 웹·제품·산업디자인까지.",
    "links": [
      ["musicbook", "guitarbook", "화성·음색을 지판과 연주로 연결하기"],
      ["musicbook", "pianobook", "음정·화성을 건반과 반주로 익히기"],
      ["musicbook", "drumbook", "박자·리듬을 손발의 연주로 연결하기"],
      ["mathbook", "musicbook", "푸리에·표본화·수의 비율로 음색과 조율 이해하기"],
      ["artbook-color", "artbook-composition", "색과 형태로 시선 이끌기"],
      ["artbook-color", "artbook-image", "이미지의 색을 읽는 눈"],
      ["artbook-composition", "artbook-drawing", "구도를 손으로 표현하기"],
      ["artbook-composition", "artbook-type", "글자도 화면의 형태로 보기"],
      ["artbook-history", "artbook-image", "시대의 맥락에서 이미지 읽기"],
      ["artbook-type", "artbook-web", "웹 화면의 읽기 흐름 만들기"],
      ["artbook-web", "artbook-product", "화면에서 제품의 경험으로"],
      ["artbook-drawing", "artbook-industrial", "스케치에서 제품의 형태로"],
      ["camerabook", "artbook-image", "촬영의 원리에서 이미지 표현으로"],
      ["camerabook", "artbook-composition", "촬영 프레임·자르기와 시선의 흐름"],
      ["camerabook", "artbook-color", "화이트 밸런스·색 보정과 색의 대비·조화"],
      ["artbook-composition", "artbook-image", "사진의 프레임·자르기와 구도"],
      ["artbook-composition", "artbook-web", "그리드·위계·여백으로 화면 구성하기"],
      ["artbook-color", "artbook-web", "팔레트·대비와 웹 접근성·디자인 토큰"],
      ["artbook-color", "artbook-industrial", "색·재료·마감으로 제품의 인상 설계하기"],
      ["artbook-history", "artbook-composition", "시대별 작품의 구도와 시선 흐름 분석하기"],
      ["artbook-product", "artbook-industrial", "사용자 조사·사용성과 물리적 제품의 인간공학"],
    ],
    "groups": [
      [
        "관찰과 기록",
        "Observe",
        "카메라의 촬영 조건과 이미지의 관계",
        [
          "camerabook"
        ]
      ],
      [
        "감각과 표현",
        "Create",
        "음·화음·리듬을 직접 듣고 구성하기",
        [
          "musicbook", "guitarbook", "pianobook", "drumbook"
        ]
      ],
      [
        "수학으로 이해하기",
        "Discover",
        "문제를 풀며 수의 관계와 구조 발견하기",
        [
          "mathbook"
        ]
      ],
      [
        "보기",
        "See",
        "색이 생기고 달라 보이는 원리",
        [
          "artbook-color"
        ]
      ],
      [
        "짜기와 그리기",
        "Make",
        "구도와 드로잉, 글자로 화면을 구성하기",
        [
          "artbook-composition",
          "artbook-drawing",
          "artbook-type"
        ]
      ],
      [
        "읽기",
        "Read",
        "미술사와 사진으로 이미지를 읽기",
        [
          "artbook-history",
          "artbook-image"
        ]
      ],
      [
        "디자인하기",
        "Design",
        "웹·디지털 제품·산업 제품으로 쓰이는 디자인",
        [
          "artbook-web",
          "artbook-product",
          "artbook-industrial"
        ]
      ]
    ]
  },
};

// 분야를 넘는 연결도 한 번만 등록합니다. 양쪽 책의 소개에서 같은 이유로 탐색합니다.
window.FIELD_MAP_CROSS_LINKS = [
  ["electricbook", "analogbook", "전압·전류·커패시터의 기초에서 증폭·필터 회로로"],
  ["powerbook", "carbook", "전력 반도체와 전기차의 인버터·모터 구동"],
  ["gpubook", "computerbook", "컴퓨터의 GPU 기초에서 워프·SIMT·메모리 병목으로"],
  ["socbook", "aibook", "SoC의 NPU와 신경망 추론·양자화"],
  ["mathbook", "networkbook", "표본화·정보 이론과 통신 신호·대역폭"],
  ["mathbook", "electricbook", "복소수·미분방정식으로 이해하는 교류와 회로 응답"],
  ["computerbook", "digitalbook", "논리 게이트·순차 회로에서 CPU를 구성하는 회로로"],
  ["computerbook", "socbook", "CPU·캐시의 기초에서 SoC 내부 구조로"],
  ["computerbook", "memorybook", "메모리 계층·가상 메모리·저장장치와 실제 DRAM·SSD"],
  ["gpubook", "aibook", "GPU의 병렬 실행·메모리 대역폭과 신경망 학습·추론"],
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
