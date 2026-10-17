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
      ["socbook", "memorybook", "시스템과 메모리의 연결"],
      ["socbook", "gpubook", "시스템에서 병렬 연산으로"],
      ["analogbook", "sensorbook", "센서 신호를 읽는 회로"],
      ["processbook", "lithobook", "회로 패턴을 웨이퍼에 옮기기"],
      ["processbook", "etchbook", "필요한 형상을 깎아 만들기"],
      ["processbook", "dopingbook", "불순물로 전기적 특성 바꾸기"],
      ["processbook", "yieldbook", "공정 결과를 수율로 읽기"],
      ["yieldbook", "failurebook", "수율 손실에서 불량 원인으로"],
      ["processbook", "packagingbook", "웨이퍼에서 연결된 칩으로"],
      ["packagingbook", "testbook", "연결한 칩의 동작 검사하기"],
      ["memorybook", "packagingbook", "메모리를 연결하고 쌓기"],
      ["sensorbook", "displaybook", "빛을 기록하고 다시 표현하기"],
      ["devicebook", "powerbook", "전력을 다루는 소자"],
      ["testbook", "chipindustrybook", "완성된 칩에서 공급망으로"],
    ],
  },
  computing: {
    "title": "컴퓨터의 원리에서 데이터와 AI 활용까지",
    "desc": "컴퓨터와 네트워크의 원리에서 데이터 분석, 신경망과 AI의 업무 활용까지.",
    "links": [
      [
        "computerbook",
        "osbook",
        "하드웨어 위에서 프로그램 실행하기"
      ],
      [
        "computerbook",
        "networkbook",
        "한 대의 컴퓨터에서 연결된 컴퓨터로"
      ],
      [
        "osbook",
        "databasebook",
        "프로그램과 데이터의 저장·관리"
      ],
      [
        "networkbook",
        "databasebook",
        "네트워크로 데이터를 주고받기"
      ],
      [
        "statbook",
        "aibook",
        "데이터의 불확실성에서 모델 학습으로"
      ],
      [
        "aibook",
        "axbook",
        "학습한 모델을 실제 업무에 적용하기"
      ],
      [
        "statbook",
        "axbook",
        "실험과 측정으로 도입 효과 판단하기"
      ],
      [
        "computerbook",
        "aibook",
        "컴퓨터의 연산에서 신경망 학습으로"
      ]
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
    links: [["electricbook", "phonebook", "회로가 모여 스마트폰이 되기까지"], ["electricbook", "carbook", "전기 회로와 자동차 제어"], ["electricbook", "shipbook", "선박의 전기·제어 시스템"], ["colorbook", "phonebook", "화면에서 빛과 색 재현하기"]],
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
      [
        "moneybook",
        "economicsbook",
        "일상의 돈에서 경제 전체로"
      ],
      [
        "economicsbook",
        "stockbook",
        "경제의 흐름과 기업·주식"
      ],
      [
        "moneybook",
        "insurebook",
        "돈의 계획에 위험 대비 더하기"
      ],
      [
        "moneybook",
        "taxbook",
        "벌고 쓰는 돈에 붙는 세금"
      ],
      [
        "stockbook",
        "taxbook",
        "투자 수익과 세금"
      ],
      [
        "moneybook",
        "estatebook",
        "금리와 대출로 주거 계획 세우기"
      ]
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
      [
        "mathbook",
        "camerabook",
        "비율과 함수로 촬영 조건 이해하기"
      ],
      [
        "mathbook",
        "musicbook",
        "수의 비율에서 음과 리듬으로"
      ],
      [
        "artbook-color",
        "artbook-composition",
        "색과 형태로 시선 이끌기"
      ],
      [
        "artbook-color",
        "artbook-image",
        "이미지의 색을 읽는 눈"
      ],
      [
        "artbook-composition",
        "artbook-drawing",
        "구도를 손으로 표현하기"
      ],
      [
        "artbook-composition",
        "artbook-type",
        "글자도 화면의 형태로 보기"
      ],
      [
        "artbook-history",
        "artbook-image",
        "시대의 맥락에서 이미지 읽기"
      ],
      [
        "artbook-type",
        "artbook-web",
        "웹 화면의 읽기 흐름 만들기"
      ],
      [
        "artbook-web",
        "artbook-product",
        "화면에서 제품의 경험으로"
      ],
      [
        "artbook-drawing",
        "artbook-industrial",
        "스케치에서 제품의 형태로"
      ],
      [
        "camerabook",
        "artbook-image",
        "촬영의 원리에서 이미지 표현으로"
      ]
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
          "musicbook"
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
