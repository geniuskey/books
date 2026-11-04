#!/usr/bin/env python3
"""GA4에서 최근 28일 동안 Books 홈에서 많이 연 책을 집계해 data/top-books.json에 쓴다.

홈(js/home.js)은 책 링크를 누를 때 open_book 이벤트에 link_url을 함께 보낸다.
link_url은 GA4 기본 측정기준(linkUrl)이라 맞춤 측정기준 등록 없이 조회된다.
open_book이 아직 충분히 쌓이지 않았으면 향상된 측정의 click(외부 링크) 이벤트로 대신 센다.

환경 변수
  GA4_PROPERTY_ID                 숫자 속성 ID (G-로 시작하는 측정 ID가 아님)
  GOOGLE_APPLICATION_CREDENTIALS  속성 뷰어 권한이 있는 서비스 계정 JSON 경로
"""
import json
import os
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
DAYS = 28
TOP = 10
MIN_OPEN_BOOK = 50  # 이보다 적으면 click 이벤트로 대신 센다.


def normalize(url):
    parts = urlsplit(url.strip())
    path = parts.path if parts.path.endswith("/") or "." in parts.path.rsplit("/", 1)[-1] else parts.path + "/"
    return f"{parts.netloc.lower()}{path}"


def book_for(url, books):
    target = normalize(url)
    best = None
    for prefix, book_id in books:
        if target.startswith(prefix) and (best is None or len(prefix) > len(best[0])):
            best = (prefix, book_id)
    return best[1] if best else None


def fetch_counts(property_id):
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (
        DateRange, Dimension, Filter, FilterExpression, Metric, RunReportRequest,
    )

    client = BetaAnalyticsDataClient()
    request = RunReportRequest(
        property=f"properties/{property_id}",
        date_ranges=[DateRange(start_date=f"{DAYS}daysAgo", end_date="yesterday")],
        dimensions=[Dimension(name="eventName"), Dimension(name="linkUrl")],
        metrics=[Metric(name="eventCount")],
        dimension_filter=FilterExpression(filter=Filter(
            field_name="eventName",
            in_list_filter=Filter.InListFilter(values=["open_book", "click"]),
        )),
        limit=10000,
    )
    rows = client.run_report(request).rows
    return [(r.dimension_values[0].value, r.dimension_values[1].value, int(r.metric_values[0].value)) for r in rows]


def main():
    property_id = os.environ.get("GA4_PROPERTY_ID", "").strip()
    if not property_id:
        sys.exit("GA4_PROPERTY_ID is not set")
    catalog = json.loads((ROOT / "data/books.json").read_text())
    books = [(normalize(b["url"]), b["id"]) for b in catalog["books"] if b.get("status") == "published" and b.get("url")]

    rows = fetch_counts(property_id)
    opened = sum(n for event, _, n in rows if event == "open_book")
    source = "open_book" if opened >= MIN_OPEN_BOOK else "click"

    counts = {}
    for event, url, n in rows:
        if event != source or not url or url == "(not set)":
            continue
        book_id = book_for(url, books)
        if book_id:
            counts[book_id] = counts.get(book_id, 0) + n

    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:TOP]
    out = {
        "updated": date.today().isoformat(),
        "period": f"최근 {DAYS}일",
        "source": source,
        "books": [{"id": book_id, "opens": n} for book_id, n in ranked],
    }
    path = ROOT / "data/top-books.json"
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print(f"{source}: {len(ranked)} books, total {sum(counts.values())} opens -> {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
