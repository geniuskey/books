/* 분야별 개념 묶음과 연결. 책의 집필 순서와는 독립적인 탐색 지도입니다. */
window.FIELD_MAPS = {
  semiconductor: {
    title: "전자 하나에서 산업 전체까지",
    desc: "원리에서 설계·제조로, 완성된 칩에서 제품과 산업으로 이어집니다.",
    relations: ["원리를 회로로", "설계를 웨이퍼로", "칩을 연결·검증", "제품으로 구현", "시장과 공급망"],
  },
  computing: {
    title: "컴퓨터의 원리에서 연결된 서비스까지",
    desc: "컴퓨터를 이해하고, 프로그램을 만들고, 서비스를 연결하고 운영합니다.",
    relations: ["원리로 만드는 코드", "코드를 서비스로"],
    groups: [
      ["컴퓨터의 기초", "Foundation", "하드웨어와 운영체제가 프로그램을 실행하는 원리", ["computerbook", "osbook"]],
      ["프로그램 만들기", "Build", "언어·알고리즘·도구로 소프트웨어를 만드는 방법", ["programbook", "algobook", "toolsbook", "webbook"]],
      ["연결과 운영", "Connect", "데이터를 저장하고 시스템을 연결하고 보호하기", ["networkbook", "databasebook", "cloudbook", "securitybook"]],
    ],
  },
  ai: {
    title: "수학과 데이터가 지능이 되기까지",
    desc: "모델을 이해하는 기초와 학습 원리, 실제 활용 분야를 연결합니다.",
    relations: ["데이터에서 학습으로", "모델에서 활용으로"],
    groups: [
      ["수학·데이터", "Foundation", "모델을 읽는 수학과 데이터를 해석하는 통계", ["mathbook", "statbook"]],
      ["학습과 모델", "Learning", "머신러닝에서 신경망·언어 모델까지", ["mlbook", "aibook"]],
      ["인식·행동·활용", "Applications", "보고, 행동하고, 사람의 일을 돕는 AI", ["visionbook", "rlbook", "workaibook"]],
    ],
  },
  electronics: {
    title: "회로에서 움직이는 시스템까지",
    desc: "전기 신호가 연결되고 제어되어 일상의 기기와 이동 수단이 됩니다.",
    relations: ["신호를 연결·제어", "부품을 시스템으로"],
    groups: [
      ["회로와 전기", "Circuits", "전자 기기를 이루는 회로의 기본 원리", ["electricbook"]],
      ["연결과 제어", "Control", "임베디드 소프트웨어와 무선 통신", ["embeddedbook", "radiobook"]],
      ["기기와 모빌리티", "Systems", "스마트폰·자동차·배터리·로봇의 작동 방식", ["phonebook", "carbook", "batterybook", "robotbook"]],
    ],
  },
  money: {
    title: "돈의 흐름을 이해하고 미래를 준비하기",
    desc: "금융의 기본 개념을 자산 운용과 위험 대비에 연결합니다.",
    relations: ["이해에서 운용으로", "자산과 위험의 균형"],
    groups: [
      ["돈과 경제", "Understand", "금리·물가·경제 뉴스의 기본 언어", ["moneybook", "econbook"]],
      ["신용과 투자", "Manage", "빌리는 돈과 투자하는 돈의 구조", ["creditbook", "stockbook"]],
      ["보장과 노후", "Prepare", "불확실한 위험과 긴 미래에 대비하기", ["insurebook", "pensionbook"]],
    ],
  },
  housing: {
    title: "사는 집에서 내 집 마련까지",
    desc: "주거와 계약의 기초를 자금 마련, 청약과 투자 판단에 연결합니다.",
    relations: ["주거 계획에 맞는 자금", "자금에서 선택으로"],
    groups: [
      ["주거와 계약", "Living", "부동산의 기본 구조와 전월세 계약", ["housebook", "rentbook"]],
      ["자금 마련", "Financing", "주택 대출의 구조와 상환 부담 이해하기", ["mortgagebook"]],
      ["내 집과 투자", "Decisions", "청약과 부동산 선택을 이해하는 기준", ["subscriptionbook", "realinvestbook"]],
    ],
  },
  law: {
    title: "일상의 권리에서 세금과 자산 이전까지",
    desc: "생활과 일에서 생기는 법적 관계를 소득과 재산의 흐름에 연결합니다.",
    relations: ["일과 소득의 연결", "소득에서 자산 이전으로"],
    groups: [
      ["생활과 일의 권리", "Rights", "생활 속 계약과 직장에서의 권리", ["lawbook", "workbook"]],
      ["소득과 세금", "Tax", "세금의 구조와 연말정산 이해하기", ["taxbook"]],
      ["상속과 증여", "Transfer", "재산을 물려주고 받는 법과 세금", ["inheritbook"]],
    ],
  },
  health: {
    title: "몸을 이해하고 일상을 돌보기",
    desc: "몸의 원리를 생활 습관과 의료 이용에 연결합니다.",
    relations: ["원리를 생활 습관으로", "일상 관리와 의료의 연결"],
    groups: [
      ["몸의 원리", "Understand", "우리 몸의 구조와 작동 방식", ["bodybook"]],
      ["일상의 건강", "Daily Care", "운동·영양·수면을 함께 이해하기", ["fitbook", "foodbook", "sleepbook"]],
      ["병원과 약", "Medical Care", "진료와 약을 이해하는 기본 지식", ["medbook"]],
    ],
  },
  culture: {
    title: "세상의 원리를 발견하고 즐기는 방법",
    desc: "자연을 설명하는 원리에서 관찰과 기록, 감각과 표현으로 관심을 넓힙니다.",
    relations: ["원리를 발견하는 관찰", "관찰에서 감각과 표현으로"],
    groups: [
      ["일상의 원리", "Discover", "주변의 현상을 설명하는 물리", ["physicsbook"]],
      ["관찰과 기록", "Observe", "빛을 기록하는 카메라와 밤하늘 탐색", ["camerabook", "starbook"]],
      ["감각과 표현", "Create", "소리와 맛을 이해하고 즐기는 방법", ["musicbook", "cookbook"]],
    ],
  },
};
