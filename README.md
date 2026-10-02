# euiyun books

[books.euiyun.com](https://books.euiyun.com/) — 인터랙티브 웹 교과서 시리즈를 한 페이지로 소개하는 사이트입니다.

## 구성
- **웨이퍼 맵** (첫 화면): 다이 하나가 책 한 권. 중심에서 가까운 다이부터 `books.json` 순서대로 채워지고, 빈 다이는 앞으로 나올 책입니다. 마우스를 따라 웨이퍼가 기울고 간섭색이 움직이며, 다이를 가리키면 검사 결과(PASS / IN FAB / EMPTY)와 수율이 표시됩니다.
- **직접 만져 보기**: 날짜마다 바뀌는 "오늘의 시뮬레이터"와 각 책의 대표 시뮬레이터 갤러리.
- **반도체 가치사슬 지도**: 설계 → 제조 공정 → 패키징 → 반도체 소자 → 시스템·응용 단계 위에 책을 배치합니다.
- **전체 책장**: 상태·단계 필터와 주제 검색이 있는 카드 목록.
- **만든 사람**: 저자 노트 (`books.json`의 `author`).
- **도구·데이터**: 교과서가 아닌 관련 프로젝트(이미지 센서 DB 등).

## 실행
빌드 과정이 없는 정적 사이트입니다. `fetch`로 JSON을 읽으므로 로컬에서는 서버로 띄웁니다.

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

## 새 책 추가하기
`data/books.json`의 `books` 배열에 항목 하나를 추가하면 웨이퍼 맵·지도·책장·통계에 모두 반영됩니다.

| 필드 | 설명 |
|---|---|
| `id` | 저장소 이름 (예: `memorybook`) |
| `code` | 웨이퍼 다이에 표시할 3글자 코드 |
| `title`, `subtitle`, `headline`, `description` | 이름, 부제, 한 줄 문구, 소개 |
| `url`, `repo` | 사이트 주소, GitHub 주소 |
| `stage` | `stages`의 id 중 하나 (`design`, `process`, `packaging`, `device`, `system`) |
| `status` | `published` 또는 `writing` |
| `chapters`, `simulators`, `level` | 출간된 책의 챕터 수, 시뮬레이터 수, 난이도 |
| `color`, `colorDark` | 라이트/다크 모드 대표색 (각 책의 `--accent`와 맞춤) |
| `topics` | 검색과 카드에 쓰이는 주제어 |
| `motif` | 표지 일러스트 (`memory`, `pixel`, `layers`, `attention`, `aperture`, `logic`, `circuit`, `package`, `car`; 없으면 기본 격자). 새 그림은 `js/covers.js`에 추가 |
| `featured` | 대표 시뮬레이터 목록: `title`, `desc`, `link`(책 주소 기준 상대 경로, 예: `chapters/hbm.html#sim-h3`), `image`(`img/sims/` 아래 캡처) |

배열 순서가 웨이퍼 다이를 채우는 순서입니다(앞쪽일수록 중심). 새 단계가 필요하면 `stages`에 추가하세요.

`og.png`(공유 미리보기 이미지)와 `img/sims/`의 시뮬레이터 화면은 캡처 이미지라 책이 늘거나 시뮬레이터가 바뀌면 다시 캡처해 주세요. 시뮬레이터 캡처는 각 책 페이지에서 `#sim-… .sim-view` 영역을 가로 720px JPEG로 저장한 것입니다.
