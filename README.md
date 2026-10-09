# Books

[books.euiyun.com](https://books.euiyun.com/) — 인터랙티브 웹 교과서 시리즈를 소개하는 사이트입니다.
시리즈는 두 갈래로 자랍니다: **일하는 지식**(반도체·SW·AI·기기)과 **살아가는 지식**(돈·집·건강·취미).

## 페이지
| 파일 | 내용 |
|---|---|
| `index.html` | 홈. 출간된 책을 바로 여는 서가, 교과서·실험 진입, 분야 카드, 질문으로 고른 대표 실험 6개, 저자 노트 |
| `/field/<분야 id>/` | 분야 페이지. 대분류의 관계와 각 분류에 속한 책을 보여 주는 지식 지도, 책장, 다른 분야 |
| `/library/` | 전체 책장. 갈래·분야·상태 필터와 검색 (`?wing=life&status=planned&q=전세`처럼 주소로도 지정 가능) |
| `/roadmap/` | 로드맵. 전체·분야별 진행률, 다음 차례와 후속 후보, 만들고 싶은 시뮬레이터. 아이디어는 진행률에서 제외 |
| `/simulators/` | 출간된 책의 전체 실험 검색. 일부 실험의 학습 질문·한영 동의어, 분야·교과서·난이도 열의 복수 선택 필터와 공유 가능한 검색 URL |
| `/paths/` | 출간된 전권을 안내하는 질문별 읽기 경로. 시작 책·읽을 주제·다음 책으로 넘어가는 이유를 안내하고, 세 가지 짧은 실험 경로 제공 |
| `/feedback/` | 전권 공통 독자 의견 창구. 오류 제보·건의·저자 응원을 로그인 없이 받고, GitHub 접수도 제공 |

## 독자 의견 접수

모든 책의 상단 아이콘과 바닥글은 `/feedback/?book=<책 id>&page=<현재 URL>`로 연결됩니다. 로그인 없는 폼에서 오류 제보·의견·저자 응원을 받고, 닉네임은 선택 사항입니다. 공개 범위의 기본값은 비공개이며 공개를 선택한 글만 페이지의 독자 목록에 바로 표시합니다. 기존 접수 글과 공개 범위가 없는 구형 폼의 글은 비공개로 저장합니다. 책 ID와 URL의 출처는 브라우저와 Worker 양쪽에서 검증합니다. 전송에 실패하면 입력을 유지하고 같은 글의 재전송에는 같은 접수 ID를 사용합니다.

관리자는 같은 페이지의 ‘관리자 로그인’에서 Google 로그인하고 전체·비공개·공개·안 읽은 글·숨긴 글을 조회합니다. 읽음/안 읽음 표시와 공개 글 숨기기/복원을 지원합니다. 관리자가 비공개 글을 공개로 바꾸는 기능은 제공하지 않습니다. 공개 조회 API는 페이지 URL과 관리자 상태를 반환하지 않으며 숨긴 글을 제외합니다. 관리자용 API는 모든 조회·수정마다 Google 서명·발급자·클라이언트 ID·만료·검증된 이메일을 서버에서 확인합니다. `geniuskey@gmail.com`만 허용합니다. 토큰은 브라우저 메모리에만 보관하며 새로고침이나 로그아웃 후 다시 로그인해야 합니다.

### 관리자 Google 로그인 설정

[Google Identity Services 설정 안내](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)에 따라 웹 애플리케이션 OAuth 클라이언트를 생성하거나 기존 클라이언트를 사용합니다. 승인된 JavaScript 원본에 `https://books.euiyun.com`을 등록합니다. 팝업 콜백 방식을 사용하므로 리디렉션 URI와 클라이언트 보안 비밀번호는 필요하지 않습니다. 동의 화면이 테스트 상태이면 관리자 계정을 테스트 사용자로 추가합니다.

같은 클라이언트 ID를 `data/feedback-config.json`의 `googleClientId`와 `worker/wrangler.jsonc`의 `GOOGLE_CLIENT_ID`에 설정하고 Worker와 정적 사이트를 함께 배포합니다. 도메인 등록만으로는 클라이언트 ID가 만들어지지 않습니다. ID 미설정 시 관리자 API는 503을 반환하고 로그인 UI는 준비 중 안내를 표시합니다. Google ID 토큰 검증은 [공식 검증 지침](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)을 따르며 `jose`로 Google JWKS를 검증합니다. 프런트엔드에서 이메일을 읽어 권한을 결정하지 않습니다.

기존 GitHub 창구도 유지합니다. 중앙 `geniuskey/books`의 `.github/ISSUE_TEMPLATE/` 양식에 책·페이지 입력란을 미리 채웁니다. GitHub 접수는 로그인과 공개 글 작성이 필요합니다. 개별 답변은 약속하지 않습니다.

### Cloudflare D1 접수 API

정적 사이트는 GitHub Pages에 두고, `worker/`의 Cloudflare Worker가 `POST /api/feedback`을 처리합니다. D1 바인딩·마이그레이션은 [Cloudflare 문서](https://developers.cloudflare.com/d1/reference/migrations/), 연속 제출 제한은 [Rate Limiting 문서](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)를 따릅니다. 제한은 Cloudflare 위치별로 IP당 5회/분, 전체 100회/분이며 완전한 봇 차단을 보장하지 않습니다. IP는 접수 DB에 저장하지 않습니다. SQL 매개변수 바인딩, 요청 크기·필드 길이 제한, 허용 출처 검사와 숨겨진 스팸 입력란을 사용합니다.

초기 설정 (Node.js 24 이상 권장):

```bash
cd worker
npm ci
npx wrangler login
npx wrangler d1 create books-feedback
```

현재 설정은 운영 D1 `books-feedback`에 연결되어 있습니다. 다른 계정에서 처음 설정할 때는 생성 결과의 `database_id`를 `worker/wrangler.jsonc`에 넣습니다. 이미 같은 이름의 DB가 있으면 `npx wrangler d1 list`로 확인하고 해당 ID를 사용하세요. 계정 내 다른 Rate Limiting 바인딩과 namespace ID가 겹치지 않는지도 확인합니다.

```bash
npm run migrate:remote
npm run deploy
```

배포 출력의 Worker URL에 `/api/feedback`을 붙여 `data/feedback-config.json`의 `endpoint`를 채웁니다. 사이트 변경을 배포하기 전에 실제 접수와 D1 저장을 확인하세요. endpoint가 비어 있거나 설정을 불러오지 못하면 폼은 전송을 막고 GitHub 창구를 안내합니다. API는 `https://books.euiyun.com`에서의 요청만 허용합니다. 토큰·비밀 키를 프런트엔드나 저장소에 넣지 않습니다.

로컬 개발:

```bash
cd worker
npm test
npm run migrate:local
npm run dev -- --var ALLOWED_ORIGINS:http://localhost:8000
```

정적 사이트는 별도 터미널에서 `python3 -m http.server 8000`으로 실행합니다. 로컬에서만 endpoint를 `http://localhost:8787/api/feedback`으로 바꿔 사용하고 배포 전 실제 Worker 주소로 복원합니다. 테스트는 저장·중복 방지·필드/출처 검증·요청 크기·연속 제출 제한·DB 장애를 확인합니다.

저자는 Cloudflare 대시보드의 D1 `books-feedback`에서 `feedback` 테이블을 확인하거나 다음 명령을 사용합니다. 조회 결과에는 독자가 남긴 비공개 글이 포함되므로 공개 이슈 등에 그대로 옮기지 않습니다.

```bash
cd worker
npx wrangler d1 execute DB --remote --command "SELECT type, nickname, message, book_id, page_url, created_at FROM feedback ORDER BY created_at DESC LIMIT 50"
```

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
- `js/field-maps.js` — 분야별 지도 제목·대분류·책 배치·연결 설명. 반도체 분류는 `books.json`의 `stages`를 사용하며, 새 책은 분류 지정 전에도 탐색 그룹에 표시됩니다.
- `css/style.css` — 각 교과서와 같은 디자인 토큰을 쓰는 공통 스타일

## 데이터: `data/books.json`
책 정보의 원본입니다. 실험 탐색과 학습 경로는 아래의 편집 데이터도 사용합니다.

- `wings` — 두 갈래 (`work`, `life`)
- `fields` — 분야. `id`, `wing`, `name`, `en`, `desc`, `color`, `colorDark`, 선택적으로 `stages`(가치사슬 단계, 지금은 반도체만)
- `books` — 책. 같은 분야 안에서는 배열 순서가 추천 읽기 순서이자 웨이퍼를 채우는 순서입니다.
- `phases` — 로드맵 단계 (1 다음 차례, 2 후속 후보). 집필 중인 책을 포함해 다음 차례는 최대 3권
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
| `motif` | 표지 일러스트 (`memory`, `pixel`, `layers`, `attention`, `aperture`, `logic`, `circuit`, `package`, `car`, `wafermap`, `litho`, `probe`, `soc`, `subpixel`, `shmoo`, `lens`, `network`, `matrix`, `umbrella`, `house`, `ripple`, `transform`; 없으면 기본 격자). 새 그림은 `js/covers.js`에 추가 |
| `featured` | 대표 시뮬레이터: `title`, `desc`, `link`(책 주소 기준 상대 경로, 예: `chapters/hbm.html#sim-h3`), `image`(`img/sims/` 아래 캡처) |

새 주제는 먼저 `data/editorial-backlog.json`에 아이디어로 보관합니다. 독자 한 유형, 기존 책으로 해결되지 않는 질문, 차별화된 대표 실험을 정한 뒤 `books.json`에 `status: "planned"`로 올립니다. 쓰기 시작하면 `writing`, 출간하면 `published`로 바꾸며 주소와 숫자를 채웁니다.

`data/editorial-backlog.json`은 공개 책장·분야 지도·진행률에 포함하지 않는 편집 자료입니다. 원래 책 정보와 통합 대상·이유, 제거한 분야를 보관합니다. `merge`는 통합 방향이며 본문 반영 완료를 뜻하지 않습니다. `idea`는 보류 아이디어, `removed-field`는 제거한 세금·법 분야의 주제입니다. GPUBook은 GPU 실행 구조와 병렬 컴퓨팅으로 범위를 좁혔고, NPU는 SoCBook 심화 섹션으로 계획합니다.

홈 분야 카드는 책이 한 권 이상 있는 분야를 모두 표시하고, 출간 전인 분야는 "준비 중"으로 표시합니다. 건강 분야는 BodyBook 한 권으로 시작하며, 다른 건강 주제는 편집 아이디어로 보관합니다.

OpticsBook을 출간해 반도체 분야의 기초 물리로 분류했습니다. 이미지 센서 개발에 필요한 회절·PSF·MTF, 박막, 마이크로렌즈·픽셀 광학 스택·입사각·광학 크로스토크를 다루며, SensorBook의 센서 구조·회로·신호 처리 설명을 광학 원리와 설계 변수로 보완합니다. 읽기 경로 `lens-to-pixel`은 OpticsBook에서 SensorBook으로 이어집니다. 현재 다음 차례(1단계)에는 책이 없고, ElectricBook·StatBook 등은 후속 후보입니다.

`og.png`(공유 미리보기 이미지)는 `tools/og.html`을 `python3 tools/build-og.py`(Playwright 필요)로 캡처한 것입니다. 책장과 숫자를 `data/books.json`·`data/experiment-catalog.json`에서 읽으므로 책을 출간한 뒤 다시 실행해 주세요. `img/sims/`의 시뮬레이터 화면은 캡처 이미지라 시뮬레이터가 바뀌면 다시 캡처해 주세요. 시뮬레이터 캡처는 각 책 페이지에서 `#sim-… .sim-view` 영역을 가로 720px JPEG로 저장한 것입니다.

## 실험 탐색 데이터

책장은 기본적으로 출간된 책을 표시합니다. `?status=all` 또는 `?status=planned`로 계획도 볼 수 있습니다.
Work/Life는 홈의 큐레이션으로 유지하고, 실험에는 분야를 가로지르는 개념 태그를 여러 개 붙입니다.

- `data/experiment-catalog.json`: 형제 폴더의 출간된 책에서 실험 앵커와 제목을 수집한 스냅샷입니다. 각 책의 HTML이 바뀌면 다시 수집합니다.
- `data/learning.json`: 개념 ID·한영 동의어, 일부 실험의 학습 질문·개념 연결, 명시적인 학습 경로. 책 배열의 진열 순서와 경로의 순서는 독립입니다.
- `data/model-validation.json`: 기준 사례를 실제 책의 계산 함수에 실행한 기록입니다. 확인 날짜·범위·담당 방식·소스 해시·입출력 사례를 보관합니다.
- `data/discovery.json`, `data/paths.json`: `tools/build-discovery.py`가 만드는 생성 파일. 직접 수정하지 않습니다. `discovery.json`은 `/simulators/`의 검색용 실험 목록이고, `paths.json`은 `/paths/`의 읽기·실험 경로입니다. 페이지마다 필요한 파일만 받도록 나눴습니다.
  - 내려받는 크기를 줄이려고 공백 없이 저장하고, 페이지가 `books.json`으로 복원할 수 있는 값은 뺍니다. 빼는 값은 `bookId`(ID 앞부분), `url`(책 URL + `chapters/<chapter>.html#<anchor>`, 다른 형태일 때만 `link`를 남김), `level`(책 난이도), 그리고 빈 값과 기본값(`reviewStatus: unreviewed`)입니다.
- 실험 ID는 `bookId/chapterName/anchorId`입니다. 기존 앵커를 바꾸면 연결된 메타데이터와 외부 링크도 함께 마이그레이션해야 합니다.
- `reviewStatus: unreviewed`는 계산 모델의 검증을 완료하지 않았다는 내부 상태입니다. `reference-checked`는 기록된 입력과 경계값의 계산만 통과했다는 뜻이며, 실제 현상에 대한 예측력이나 전체 화면 조작을 보증하지 않습니다. 검색 등록이나 링크 확인만으로 상태를 변경하지 않습니다.
- 검색은 전체 실험의 제목·책 이름과, 보강된 일부 실험의 설명·질문·개념 동의어를 대상으로 합니다. 모든 챕터 본문을 검색하는 기능은 아직 없습니다. 난이도는 개별 실험 평가가 아닌 책 메타데이터입니다.

```bash
python tools/collect-experiments.py  # 형제 폴더에 출간된 책 저장소가 있을 때
python tools/build-discovery.py
python tools/check-discovery.py
node tools/check-models.cjs
```

검사기는 ID 중복, 참조, 이미지, 생성 데이터 동기화와 등록된 기준 사례를 확인합니다. 형제 폴더에 책 저장소가 있으면 챕터·앵커·계산 함수·소스 해시를 확인하고, 없는 책은 미확인 개수를 보고합니다. `check-models.cjs` 실행에는 Node.js가 필요합니다. 책 메타데이터의 시뮬레이터 수는 기존 수기 숫자이며 검색 결과 개수는 실제 앵커 수입니다. 실제 배포 URL 가용성과 모델의 물리적 정확성은 별도 확인 대상입니다.

새 계산 모델을 `reference-checked`로 표시하려면 `model-validation.json`에 실험의 전체 ID, 확인 날짜, 검증 범위와 한계, 실제 계산 소스의 SHA-256, 알려진 기준값과 경계 조건을 기록하고 `check-models.cjs`에 해당 함수 실행 경로를 연결합니다. 책 소스가 바뀌면 해시 검사가 실패하므로 사례를 다시 검토한 뒤 해시를 갱신합니다. 학습 질문과 간단한 실험 설명은 `learning.json`에 추가하고 생성 파일을 다시 만듭니다. 현재 2개 실험의 계산 기준 사례를 확인했으며 나머지는 미검증 상태입니다.

`.github/workflows/check-discovery.yml`은 포털 데이터 변경과 주간 일정에 실행됩니다. 확인 대상인 YieldBook과 ComputerBook을 체크아웃해 해시와 기준 사례를 검사합니다. 다른 책의 앵커 전체 수집 검사는 모든 형제 저장소가 있는 로컬 작업 공간에서 실행합니다.

## 집필·실험 품질 기준

새 주제는 내부 상태를 보여 줄 수 있는지, 인과관계를 조작할 수 있는지, 트레이드오프나 흔한 오해를 드러내는지를 기준으로 선정합니다. 실험 수 자체를 학습 성과로 삼지 않습니다.

대표 실험은 질문 → 예측 → 조작 → 비교 → 설명 → 다른 조건에 적용 순서로 설계합니다. 모델 가정·생략한 현상·유효 입력 범위·단위·출처를 실험 가까이 밝힙니다. 초기화와 기준 시나리오를 제공하고 확률 실험에는 재현 가능한 시드를 둡니다. 매개변수 공유 기능을 추가할 때는 모델 버전도 보존합니다.

모델 검증에는 알려진 기준값, 경계 조건, 보존 법칙 또는 예상되는 경향, 확률 모델의 반복 시행 결과를 사용합니다. 화면이 잘 나온다는 사실과 계산이 올바르다는 사실을 구분합니다. `reviewed` 상태를 도입하려면 검토자·날짜·모델 버전·검증 사례·출처를 함께 기록해야 합니다.

학습 품질은 새 조건의 결과를 예측하는지, 이유를 설명하는지, 다른 문제에 적용하는지로 확인합니다. 실험 카드에 질문을 추가한 것만으로 학습 효과가 검증된 것은 아닙니다.

## 다음 아키텍처 단계

현재 구현은 전체 실험의 제목과 링크, 일부 실험의 학습 정보, 명시적인 학습 경로를 연결합니다. 다음 작업은 아래 순서로 진행합니다.

1. 서로 다른 책 2~3권에서 초기화·비교·상태 공유·접근성 인터페이스를 실제 적용하고 공통 규약을 확정합니다.
2. 검증된 반복 기능만 버전이 고정된 공통 코어로 추출합니다. 책별 repo와 노광·소자·패키지·신경망 계산 엔진은 독립적으로 유지합니다. 템플릿만 복사해서 배포한 뒤 방치하지 않고 업데이트 검증 절차를 둡니다.
3. 각 책이 `schemaVersion`, `bookId`, `revision`, 챕터·실험의 안정적인 ID와 상대 URL, 개념 참조를 담은 manifest를 생성하게 합니다. 중앙은 해당 버전의 manifest를 수집·검증해 정적 검색 데이터를 만듭니다. 수집 실패 시 이전 정상 인덱스를 유지합니다.
4. 중앙 편집 데이터는 분야·동의어·큐레이션·학습 경로를 소유하고, 개별 책은 챕터·실험·모델 설명을 소유합니다. 동일 정보를 양쪽에서 수동 편집하지 않습니다.
5. 실험·챕터 검색의 실제 사용 사례가 쌓이면 본문 인덱스와 검색 순위를 확장합니다. 의미 검색과 그래프 DB는 요구가 확인된 뒤 도입합니다.

개념 ID와 출처는 공유하되, 독자의 배경과 목적에 맞춘 본문 설명의 반복은 허용합니다. 외부 검색이나 전체 책의 자동 수집·공통 코어 전환은 현재 구현에 포함되지 않습니다.

### 페이지 주소

하위 페이지는 `<이름>/index.html`에서 제공하며 공개 주소는 `/<이름>/`입니다. CSS·JavaScript·데이터 경로는 사이트 루트 기준으로 작성합니다. 기존 `*.html` 파일은 북마크와 다른 책의 링크를 위해 유지하며 검색 조건과 해시를 새 주소에 전달합니다. GitHub Pages 정적 호스팅에서는 이 이동이 HTTP 301이 아닌 브라우저 이동으로 처리됩니다.

주소 변경 후 `python3 tools/check-routes.py`로 내부 파일 경로와 기존 주소의 검색 조건·해시 보존을 검사합니다.

분야별 고유 페이지는 `tools/templates/field.html`과 `data/books.json`을 바탕으로 `python3 tools/build-fields.py`가 생성합니다. 분야 추가 또는 템플릿 수정 후 실행하세요. `/field/`는 분야 목록이며 기존 `/field/?f=<id>` 링크는 해당 분야의 고유 주소로 이동합니다.
