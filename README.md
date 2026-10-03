# euiyun books

[books.euiyun.com](https://books.euiyun.com/) — 인터랙티브 웹 교과서 시리즈를 소개하는 사이트입니다.
시리즈는 두 갈래로 자랍니다: **일하는 지식**(반도체·SW·AI·전자)과 **살아가는 지식**(돈·집·세금·건강·취미).

## 페이지
| 파일 | 내용 |
|---|---|
| `index.html` | 홈. 모든 책을 담은 마스터 웨이퍼(분야마다 부채꼴 하나), 두 갈래와 분야 카드, 대표 시뮬레이터, 다음 차례, 저자 노트, 도구 |
| `field.html?f=<분야 id>` | 분야 페이지. 분야 웨이퍼, 가치사슬(단계가 있는 분야) 또는 추천 읽기 순서, 책장, 다른 분야 |
| `library.html` | 전체 책장. 갈래·분야·상태 필터와 검색 (`?wing=life&status=planned&q=전세`처럼 주소로도 지정 가능) |
| `roadmap.html` | 로드맵. 전체·분야별 진행률, 단계별(다음 차례 → 그다음 → 언젠가) 책 목록과 만들고 싶은 시뮬레이터 |

## 실행
빌드 과정이 없는 정적 사이트입니다. `fetch`로 JSON을 읽으므로 로컬에서는 서버로 띄웁니다.

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

## 코드 구조
- `js/core.js` — 데이터 로딩, 머리말·꼬리말, 책 카드, 진행률 막대 (모든 페이지 공통)
- `js/wafer.js` — 웨이퍼 맵 (분야 하나 / 전체 부채꼴 모드)과 분야 카드용 작은 웨이퍼
- `js/covers.js` — 책 표지 일러스트
- `js/home.js`, `js/field.js`, `js/library.js`, `js/roadmap.js` — 페이지별 렌더링
- `css/style.css` — 각 교과서와 같은 디자인 토큰을 쓰는 공통 스타일

## 데이터: `data/books.json`
모든 페이지가 이 파일 하나에서 그려집니다.

- `wings` — 두 갈래 (`work`, `life`)
- `fields` — 분야. `id`, `wing`, `name`, `en`, `desc`, `color`, `colorDark`, 선택적으로 `stages`(가치사슬 단계, 지금은 반도체만)
- `books` — 책. 같은 분야 안에서는 배열 순서가 추천 읽기 순서이자 웨이퍼를 채우는 순서입니다.
- `phases` — 로드맵 단계 (1 다음 차례, 2 그다음, 3 언젠가)
- `statusLabels` — 상태 표시 문구 (`published` 출간, `writing` 집필 중, `planned` 집필 예정)
- `tools`, `author` — 도구·데이터 목록, 저자 노트

### 책 필드
| 필드 | 설명 |
|---|---|
| `id`, `code` | 저장소 이름, 웨이퍼 다이에 표시할 3글자 코드 (겹치지 않게) |
| `title`, `subtitle`, `description` | 이름, 부제, 소개 |
| `field`, `stage` | 분야 id, (단계가 있는 분야라면) 단계 id |
| `status`, `phase` | 상태, 로드맵 단계 |
| `ideas` | 집필 예정 책에서 만들고 싶은 시뮬레이터 |
| `headline`, `url`, `repo` | 출간·집필 중인 책의 한 줄 문구, 사이트 주소, GitHub 주소 |
| `chapters`, `simulators`, `level`, `topics` | 출간된 책의 챕터 수, 시뮬레이터 수, 난이도, 주제어 |
| `color`, `colorDark` | 책 대표색 (없으면 분야 색). 기본은 각 책 사이트의 `--accent`지만, 같은 분야에서 비슷한 색이 겹치면 이 사이트에서만 다른 색으로 바꿔 씁니다 |
| `motif` | 표지 일러스트 (`memory`, `pixel`, `layers`, `attention`, `aperture`, `logic`, `circuit`, `package`, `car`, `wafermap`, `litho`, `probe`, `soc`, `subpixel`, `shmoo`; 없으면 기본 격자). 새 그림은 `js/covers.js`에 추가 |
| `featured` | 대표 시뮬레이터: `title`, `desc`, `link`(책 주소 기준 상대 경로, 예: `chapters/hbm.html#sim-h3`), `image`(`img/sims/` 아래 캡처) |

새 책을 계획하면 `status: "planned"`로 한 줄 추가하고, 쓰기 시작하면 `writing`, 출간하면 `published`로 바꾸며 주소와 숫자를 채우면 됩니다.

`og.png`(공유 미리보기 이미지)와 `img/sims/`의 시뮬레이터 화면은 캡처 이미지라 책이 늘거나 시뮬레이터가 바뀌면 다시 캡처해 주세요. 시뮬레이터 캡처는 각 책 페이지에서 `#sim-… .sim-view` 영역을 가로 720px JPEG로 저장한 것입니다.
