# euiyun books

[books.euiyun.com](https://books.euiyun.com/) — 인터랙티브 웹 교과서 시리즈를 한 페이지로 소개하는 사이트입니다.

## 구성
- **웨이퍼 맵** (첫 화면): 다이 하나가 책 한 권. 중심에서 가까운 다이부터 `books.json` 순서대로 채워지고, 빈 다이는 앞으로 나올 책입니다.
- **반도체 가치사슬 지도**: 설계 → 제조 공정 → 패키징 → 반도체 소자 → 시스템·응용 단계 위에 책을 배치합니다.
- **전체 책장**: 상태·단계 필터와 주제 검색이 있는 카드 목록.
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

배열 순서가 웨이퍼 다이를 채우는 순서입니다(앞쪽일수록 중심). 새 단계가 필요하면 `stages`에 추가하세요.

`og.png`(공유 미리보기 이미지)는 첫 화면을 캡처한 것이라 통계 숫자가 박혀 있습니다. 책이 늘면 다시 캡처해 주세요.
