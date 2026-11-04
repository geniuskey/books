#!/usr/bin/env python3
"""GA4에서 Books 방문 통계와 홈에서 많이 연 책을 집계해 data/analytics.json에 쓴다.

- stats: GA4를 단 날(SINCE)부터 어제까지 *.euiyun.com 책 사이트의 다녀간 분·다시 찾아온 분·페이지 본 횟수.
  같은 속성을 쓰는 책 사이트(shipbook, science 등)도 포함하고 euiyun.com 본 사이트는 뺀다.
- opens: 최근 28일 동안 Books 홈에서 책별로 연 횟수(많은 순). 홈은 상위 10권을 맨 위 서가에,
  분야별 서가는 이 순서대로 보여 준다. 홈(js/home.js)은 책 링크 클릭마다 open_book
  이벤트에 link_url을 보낸다. link_url은 GA4 기본 측정기준(linkUrl)이라 맞춤 측정기준 없이 조회된다.
  open_book이 아직 적으면 향상된 측정의 click(외부 링크) 이벤트로 대신 센다.

환경 변수
  GA4_PROPERTY_ID                 숫자 속성 ID (G-로 시작하는 측정 ID가 아님)
  GOOGLE_APPLICATION_CREDENTIALS  속성 뷰어 권한이 있는 서비스 계정 JSON 경로
"""
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
SINCE = "2026-10-30"  # Books에 GA4를 단 날 (04579c7)
HOME_HOST = "books.euiyun.com"
BOOK_HOSTS = r"[a-z0-9-]+\.euiyun\.com"  # www.euiyun.com은 아래에서 뺀다.
DAYS = 28
MIN_OPEN_BOOK = 50


def normalize(url):
    parts = urlsplit(url.strip())
    last = parts.path.rsplit("/", 1)[-1]
    path = parts.path if parts.path.endswith("/") or "." in last else parts.path + "/"
    return f"{parts.netloc.lower()}{path}"


def book_for(url, books):
    target = normalize(url)
    best = None
    for prefix, book_id in books:
        if target.startswith(prefix) and (best is None or len(prefix) > len(best[0])):
            best = (prefix, book_id)
    return best[1] if best else None


class GA4:
    def __init__(self, property_id):
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.analytics.data_v1beta import types

        self.t = types
        self.client = BetaAnalyticsDataClient()
        self.property = f"properties/{property_id}"

    def string(self, field, value, match="EXACT"):
        t = self.t
        return t.FilterExpression(filter=t.Filter(field_name=field, string_filter=t.Filter.StringFilter(
            value=value, match_type=getattr(t.Filter.StringFilter.MatchType, match))))

    def report(self, start, dimensions, metrics, filters):
        t = self.t
        request = t.RunReportRequest(
            property=self.property,
            date_ranges=[t.DateRange(start_date=start, end_date="yesterday")],
            dimensions=[t.Dimension(name=d) for d in dimensions],
            metrics=[t.Metric(name=m) for m in metrics],
            dimension_filter=t.FilterExpression(and_group=t.FilterExpressionList(expressions=filters)),
            limit=10000,
        )
        return [([d.value for d in r.dimension_values], [int(m.value) for m in r.metric_values])
                for r in self.client.run_report(request).rows]


def build_stats(ga):
    hosts = [ga.string("hostName", BOOK_HOSTS, "FULL_REGEXP"),
             ga.t.FilterExpression(not_expression=ga.string("hostName", "www.euiyun.com"))]
    totals = ga.report(SINCE, [], ["totalUsers", "screenPageViews"], hosts)
    split = ga.report(SINCE, ["newVsReturning"], ["totalUsers"], hosts)
    visitors, views = totals[0][1] if totals else (0, 0)
    returning = next((m[0] for d, m in split if d[0] == "returning"), 0)
    until = (date.today() - timedelta(days=1)).isoformat()
    return {"since": SINCE, "until": until, "visitors": visitors, "returning": returning, "pageViews": views}


def build_top(ga, books):
    from_home = ga.string("hostName", HOME_HOST)
    rows = {}
    for event in ("open_book", "click"):
        rows[event] = ga.report(f"{DAYS}daysAgo", ["linkUrl"], ["eventCount"], [from_home, ga.string("eventName", event)])
    opened = sum(m[0] for _, m in rows["open_book"])
    source = "open_book" if opened >= MIN_OPEN_BOOK else "click"
    counts = {}
    for (url,), (n,) in rows[source]:
        book_id = book_for(url, books) if url and url != "(not set)" else None
        if book_id:
            counts[book_id] = counts.get(book_id, 0) + n
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return {"period": f"최근 {DAYS}일", "source": source, "books": [{"id": i, "opens": n} for i, n in ranked]}


def main():
    property_id = os.environ.get("GA4_PROPERTY_ID", "").strip()
    if not property_id.isdigit():
        sys.exit("GA4_PROPERTY_ID must be the numeric property ID")
    catalog = json.loads((ROOT / "data/books.json").read_text())
    books = [(normalize(b["url"]), b["id"]) for b in catalog["books"] if b.get("status") == "published" and b.get("url")]

    ga = GA4(property_id)
    out = {"updated": date.today().isoformat(), "stats": build_stats(ga), "opens": build_top(ga, books)}
    path = ROOT / "data/analytics.json"
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    s, top = out["stats"], out["opens"]
    print(f"stats: {s['visitors']} visitors, {s['returning']} returning, {s['pageViews']} views since {s['since']}")
    print(f"opens ({top['source']}): {len(top['books'])} books, {sum(b['opens'] for b in top['books'])} opens -> {path.relative_to(ROOT)}")
    if not s["visitors"]:
        print("::warning::GA4 returned no visitors for *.euiyun.com. Check that GA4_PROPERTY_ID is the Books property (G-LST8C5WL08).")


if __name__ == "__main__":
    main()
