/* 책 표지 일러스트. books.json의 motif 이름 → SVG 문자열 (viewBox 0 0 200 130, 흰 선 위주).
   애니메이션은 css의 .cv-* 클래스가 담당하고, 카드에 마우스를 올렸을 때만 움직인다. */
(function () {
  "use strict";
  const W = "currentColor";
  const svg = (body) => `<svg class="cover-art" viewBox="0 0 200 130" aria-hidden="true" focusable="false">${body}</svg>`;
  const range = (n) => Array.from({ length: n }, (_, i) => i);
  // 결정적 의사난수: 새로고침해도 같은 그림
  const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const M = {
    // DRAM 셀 어레이: 워드라인·비트라인 위에서 비트가 깜박인다
    memory() {
      const r = rnd(7); let s = "";
      range(5).forEach((j) => { s += `<line x1="18" x2="196" y1="${18 + j * 22}" y2="${18 + j * 22}" stroke="${W}" stroke-opacity=".25"/>`; });
      range(9).forEach((i) => { s += `<line y1="6" y2="124" x1="${26 + i * 20}" x2="${26 + i * 20}" stroke="${W}" stroke-opacity=".18"/>`; });
      range(5).forEach((j) => range(9).forEach((i) => {
        const on = r() > 0.45, x = 26 + i * 20, y = 18 + j * 22;
        s += `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="2.5" fill="${W}" fill-opacity="${on ? 0.85 : 0.12}" stroke="${W}" stroke-opacity=".5"${on && r() > 0.5 ? ` class="cv-blink" style="animation-delay:${(r() * 2).toFixed(2)}s"` : ""}/>`;
      }));
      return svg(s);
    },
    // 베이어 컬러 필터 + 마이크로렌즈, 위에서 광자가 떨어진다
    pixel() {
      const C = { R: "#ff8a8a", G: "#7deaa0", B: "#8ab4ff" }; let s = "";
      range(4).forEach((j) => range(7).forEach((i) => {
        const k = j % 2 ? (i % 2 ? "B" : "G") : (i % 2 ? "G" : "R");
        const x = 34 + i * 22, y = 40 + j * 22;
        s += `<rect x="${x}" y="${y}" width="20" height="20" rx="2" fill="${C[k]}" fill-opacity=".8"/><circle cx="${x + 10}" cy="${y + 10}" r="8.5" fill="${W}" fill-opacity=".14" stroke="${W}" stroke-opacity=".55"/>`;
      }));
      [52, 96, 140, 118, 74, 162].forEach((x, k) => {
        s += `<circle class="cv-fall" style="animation-delay:${k * 0.35}s" cx="${x}" cy="14" r="2.6" fill="${W}"/>`;
      });
      return svg(s);
    },
    // FinFET 단면: 기판·핀·게이트가 한 층씩 쌓인다
    layers() {
      let s = `<rect x="10" y="100" width="190" height="30" fill="${W}" fill-opacity=".22"/>`;
      s += `<rect x="10" y="86" width="190" height="14" fill="${W}" fill-opacity=".12"/>`;
      [44, 92, 140].forEach((x) => { s += `<rect x="${x}" y="46" width="16" height="54" rx="2" fill="${W}" fill-opacity=".7"/>`; });
      s += `<path class="cv-grow" d="M30 86 V38 Q30 30 38 30 H164 Q172 30 172 38 V86 H162 V42 H150 V86 H134 V42 H118 V86 H102 V42 H86 V86 H70 V42 H58 V86 Z" fill="${W}" fill-opacity=".32" stroke="${W}" stroke-opacity=".7"/>`;
      s += `<rect x="20" y="14" width="162" height="8" rx="2" fill="${W}" fill-opacity=".45"/>`;
      range(6).forEach((i) => { s += `<rect x="${30 + i * 26}" y="22" width="6" height="8" fill="${W}" fill-opacity=".5"/>`; });
      return svg(s);
    },
    // 인과적 어텐션 히트맵
    attention() {
      const r = rnd(11); let s = ""; const n = 7, p = 15, x0 = 74, y0 = 14;
      range(n).forEach((i) => range(n).forEach((j) => {
        const x = x0 + j * p, y = y0 + i * p;
        if (j > i) { s += `<rect x="${x}" y="${y}" width="13" height="13" rx="2" fill="none" stroke="${W}" stroke-opacity=".18"/>`; return; }
        const a = j === i ? 0.9 : 0.15 + r() * 0.6;
        s += `<rect class="cv-pulse" style="animation-delay:${((i + j) * 0.12).toFixed(2)}s" x="${x}" y="${y}" width="13" height="13" rx="2" fill="${W}" fill-opacity="${a.toFixed(2)}"/>`;
      }));
      return svg(s);
    },
    // 조리개 날개: 육각형 개구가 열리고 닫힌다
    aperture() {
      const cx = 132, cy = 65; let s = "";
      s += `<circle cx="${cx}" cy="${cy}" r="56" fill="none" stroke="${W}" stroke-opacity=".3" stroke-width="6"/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="46" fill="${W}" fill-opacity=".28"/>`;
      const hex = range(6).map((k) => { const a = (Math.PI / 3) * k + 0.3; return `${(cx + 22 * Math.cos(a)).toFixed(1)},${(cy + 22 * Math.sin(a)).toFixed(1)}`; }).join(" ");
      let blades = "";
      range(6).forEach((k) => {
        const a = (Math.PI / 3) * k + 0.3, b = a + 1.25;
        blades += `<line x1="${(cx + 22 * Math.cos(a)).toFixed(1)}" y1="${(cy + 22 * Math.sin(a)).toFixed(1)}" x2="${(cx + 46 * Math.cos(b)).toFixed(1)}" y2="${(cy + 46 * Math.sin(b)).toFixed(1)}" stroke="${W}" stroke-opacity=".75" stroke-width="1.4"/>`;
      });
      s += `<g class="cv-iris" style="transform-origin:${cx}px ${cy}px"><polygon points="${hex}" fill="#000" fill-opacity=".35" stroke="${W}" stroke-width="1.4"/>${blades}</g>`;
      return svg(s);
    },
    // 논리 게이트 회로: 신호가 선을 따라 흐른다
    logic() {
      const and = (x, y) => `<path d="M${x} ${y} h14 a14 14 0 0 1 0 28 h-14 z" fill="${W}" fill-opacity=".22" stroke="${W}" stroke-width="1.5"/>`;
      const or = (x, y) => `<path d="M${x} ${y} q10 14 0 28 q24 2 34 -14 q-10 -16 -34 -14 z" fill="${W}" fill-opacity=".22" stroke="${W}" stroke-width="1.5"/>`;
      let s = and(70, 18) + and(70, 84) + or(126, 51);
      const wires = ["M20 24 H70", "M20 40 H70", "M20 90 H70", "M20 106 H70", "M98 32 H112 V58 H128", "M98 98 H112 V72 H128", "M160 65 H196"];
      wires.forEach((d) => { s += `<path d="${d}" fill="none" stroke="${W}" stroke-opacity=".35" stroke-width="1.5"/><path class="cv-flow" d="${d}" fill="none" stroke="${W}" stroke-width="2" stroke-dasharray="6 14"/>`; });
      [24, 40, 90, 106].forEach((y) => { s += `<circle cx="20" cy="${y}" r="3" fill="${W}"/>`; });
      return svg(s);
    },
    // 표준 셀 배치와 배선
    circuit() {
      const r = rnd(5); let s = "";
      range(4).forEach((j) => {
        let x = 40;
        while (x < 190) { const w = 10 + Math.round(r() * 22); if (x + w > 196) break; s += `<rect x="${x}" y="${16 + j * 28}" width="${w}" height="16" rx="1.5" fill="${W}" fill-opacity="${(0.15 + r() * 0.35).toFixed(2)}" stroke="${W}" stroke-opacity=".4"/>`; x += w + 4; }
      });
      ["M44 32 V44 H120 V60", "M88 60 V72 H170 V88", "M60 88 V100 H140 V116"].forEach((d) => { s += `<path class="cv-flow" d="${d}" fill="none" stroke="${W}" stroke-width="1.6" stroke-dasharray="5 8"/>`; });
      return svg(s);
    },
    // 2.5D 패키지: 기판·인터포저 위에 HBM이 쌓인다
    package() {
      let s = `<rect x="16" y="108" width="180" height="12" rx="2" fill="${W}" fill-opacity=".3"/><rect x="30" y="94" width="152" height="9" rx="1.5" fill="${W}" fill-opacity=".45"/>`;
      range(18).forEach((i) => { s += `<circle cx="${36 + i * 8.4}" cy="105.5" r="2" fill="${W}" fill-opacity=".7"/>`; });
      s += `<rect x="40" y="62" width="58" height="30" rx="2" fill="${W}" fill-opacity=".55"/>`;
      range(6).forEach((k) => { s += `<rect class="cv-drop" style="animation-delay:${(5 - k) * 0.12}s" x="114" y="${84 - k * 11}" width="54" height="8" rx="1.5" fill="${W}" fill-opacity="${(0.35 + k * 0.08).toFixed(2)}"/>`; });
      [126, 141, 156].forEach((x) => { s += `<line x1="${x}" x2="${x}" y1="20" y2="92" stroke="#000" stroke-opacity=".25" stroke-width="1.5"/>`; });
      return svg(s);
    },
    // 자동차와 레이더 파면
    car() {
      let s = `<path d="M20 92 h18 a10 10 0 0 1 20 0 h50 a10 10 0 0 1 20 0 h12 v-18 l-14 -6 l-18 -18 h-46 l-22 22 l-20 4 z" fill="${W}" fill-opacity=".45" stroke="${W}" stroke-width="1.5"/>`;
      s += `<circle cx="48" cy="94" r="8" fill="${W}" fill-opacity=".8"/><circle cx="118" cy="94" r="8" fill="${W}" fill-opacity=".8"/>`;
      [0, 1, 2].forEach((k) => { s += `<path class="cv-wave" style="animation-delay:${k * 0.5}s" d="M150 ${58 - k * 12} q${14 + k * 10} ${18 + k * 12} 0 ${36 + k * 24}" fill="none" stroke="${W}" stroke-width="2"/>`; });
      return svg(s);
    },
    // 웨이퍼 맵: 가장자리 고리 모양으로 불량 다이가 몰려 있다
    wafermap() {
      const cx = 130, cy = 65, r = 58, p = 11; let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${W}" fill-opacity=".14" stroke="${W}" stroke-opacity=".6"/>`;
      for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) {
        const x = cx + i * p, y = cy + j * p, far = Math.hypot(Math.abs(i * p) + p / 2, Math.abs(j * p) + p / 2);
        if (far > r - 2) continue;
        const ring = Math.hypot(i, j) > 3.6;
        s += `<rect x="${x - 4.5}" y="${y - 4.5}" width="9" height="9" rx="1.5" fill="${ring ? "#ff6b6b" : W}" fill-opacity="${ring ? 0.9 : 0.55}"${ring ? ` class="cv-blink" style="animation-delay:${((i + j + 10) * 0.07).toFixed(2)}s"` : ""}/>`;
      }
      return svg(s);
    },
    // 노광: 마스크를 지난 빛이 렌즈에 모여 웨이퍼에 선을 새긴다
    litho() {
      let s = `<rect x="60" y="10" width="130" height="7" rx="1.5" fill="${W}" fill-opacity=".85"/>`;
      [72, 104, 136, 168].forEach((x) => { s += `<rect x="${x}" y="10" width="14" height="7" fill="#000" fill-opacity=".35"/>`; });
      s += `<ellipse cx="125" cy="52" rx="58" ry="9" fill="${W}" fill-opacity=".3" stroke="${W}" stroke-opacity=".7"/>`;
      [70, 98, 125, 152, 180].forEach((x, k) => {
        s += `<path class="cv-flow" style="animation-delay:${k * 0.15}s" d="M${x} 18 L${x} 46 L${100 + k * 12.5} 98" fill="none" stroke="${W}" stroke-opacity=".7" stroke-width="1.4" stroke-dasharray="5 7"/>`;
      });
      s += `<rect x="60" y="100" width="130" height="22" fill="${W}" fill-opacity=".22"/>`;
      [92, 108, 124, 140, 156].forEach((x) => { s += `<rect class="cv-grow" x="${x}" y="90" width="7" height="10" rx="1" fill="${W}" fill-opacity=".85"/>`; });
      return svg(s);
    },
    // 불량 분석: 배선 위를 훑는 돋보기와 빛나는 결함 한 점
    probe() {
      let s = "";
      [26, 50, 74, 98].forEach((y, k) => { s += `<rect x="${60 + (k % 2) * 14}" y="${y}" width="${118 - (k % 2) * 20}" height="7" rx="2" fill="${W}" fill-opacity=".35"/>`; });
      [84, 118, 152].forEach((x) => { s += `<rect x="${x}" y="26" width="7" height="79" fill="${W}" fill-opacity=".22"/>`; });
      s += `<circle class="cv-pulse" cx="121" cy="77" r="6" fill="#ff6b6b"/><circle cx="121" cy="77" r="13" fill="#ff6b6b" fill-opacity=".25"/>`;
      s += `<g class="cv-scan-lens"><circle cx="121" cy="77" r="24" fill="none" stroke="${W}" stroke-width="3"/><line x1="138" y1="94" x2="156" y2="112" stroke="${W}" stroke-width="5" stroke-linecap="round"/></g>`;
      return svg(s);
    },
    // SoC: 다이 평면도 위의 블록들, 블록 사이로 데이터가 오간다
    soc() {
      const blocks = [[64, 10, 40, 34, 0.75], [108, 10, 30, 34, 0.5], [142, 10, 46, 52, 0.85], [64, 48, 74, 14, 0.35], [64, 66, 50, 34, 0.6], [118, 66, 70, 16, 0.45], [118, 86, 70, 14, 0.3], [64, 104, 124, 16, 0.4]];
      let s = `<rect x="58" y="4" width="136" height="122" rx="4" fill="#000" fill-opacity=".18" stroke="${W}" stroke-opacity=".6"/>`;
      blocks.forEach(([x, y, w, h, o], k) => { s += `<rect class="cv-pulse" style="animation-delay:${(k * 0.25).toFixed(2)}s" x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${W}" fill-opacity="${o}"/>`; });
      s += `<path class="cv-flow" d="M84 44 V56 H165 V62 M89 100 V112 H150" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="2" stroke-dasharray="4 6"/>`;
      return svg(s);
    },
    // 디스플레이: RGB 서브픽셀이 켜졌다 꺼진다
    subpixel() {
      const C = ["#ff7a8a", "#7deaa0", "#8ab4ff"]; let s = "";
      range(4).forEach((j) => range(6).forEach((i) => range(3).forEach((k) => {
        const x = 62 + i * 21 + k * 6.5, y = 10 + j * 28;
        s += `<rect class="cv-pulse" style="animation-delay:${(((i + j) % 4) * 0.3 + k * 0.1).toFixed(2)}s" x="${x}" y="${y}" width="5" height="24" rx="1.5" fill="${C[k]}" fill-opacity=".85"/>`;
      })));
      return svg(s);
    },
    // 테스트: 셔무 플롯, 전압·주파수 격자에서 통과/불량 경계
    shmoo() {
      let s = "";
      range(8).forEach((j) => range(10).forEach((i) => {
        const pass = j >= 7 - Math.floor(i * 0.7) - 1 && i > 0;
        s += `<rect x="${64 + i * 13}" y="${10 + j * 13.5}" width="11.5" height="12" rx="1.5" fill="${pass ? "#7deaa0" : "#ff7a8a"}" fill-opacity="${pass ? 0.8 : 0.55}"/>`;
      }));
      s += `<rect class="cv-pulse" x="128" y="51" width="38" height="54" rx="2" fill="none" stroke="${W}" stroke-width="2"/>`;
      return svg(s);
    },
    // 스마트폰: 유리·디스플레이·보드·배터리·뒷판이 비스듬히 분해되어 떠 있다
    phone() {
      let s = "";
      const layers = [[0.28, "none"], [0.5, "screen"], [0.4, "board"], [0.55, "battery"], [0.22, "back"]];
      layers.forEach(([o, kind], k) => {
        const x = 70 + k * 18, y = 6 + k * 12;
        s += `<g class="cv-drop" style="animation-delay:${(k * 0.12).toFixed(2)}s"><rect x="${x}" y="${y}" width="62" height="96" rx="9" fill="${W}" fill-opacity="${o}" stroke="${W}" stroke-opacity=".7"/>`;
        if (kind === "board") s += `<rect x="${x + 8}" y="${y + 8}" width="20" height="14" rx="2" fill="#000" fill-opacity=".3"/><rect x="${x + 34}" y="${y + 8}" width="18" height="30" rx="2" fill="#000" fill-opacity=".2"/>`;
        if (kind === "battery") s += `<rect x="${x + 10}" y="${y + 30}" width="42" height="52" rx="4" fill="#000" fill-opacity=".18"/>`;
        if (kind === "back") s += `<rect x="${x + 6}" y="${y + 6}" width="20" height="20" rx="5" fill="#000" fill-opacity=".3"/>`;
        s += `</g>`;
      });
      return svg(s);
    },
    // 소자 물리: pn 접합의 에너지 밴드가 휘고, 전자와 정공이 떠 있다
    band() {
      let s = "";
      [[30, "Ec"], [74, "Ev"]].forEach(([y, label]) => {
        s += `<path class="cv-grow" d="M64 ${y} H112 C130 ${y} 134 ${y + 26} 152 ${y + 26} H196" fill="none" stroke="${W}" stroke-width="2.5"/>`;
        s += `<text x="62" y="${y - 5}" fill="${W}" fill-opacity=".7" font-size="9" font-family="monospace">${label}</text>`;
      });
      s += `<line x1="64" y1="60" x2="196" y2="60" stroke="${W}" stroke-opacity=".6" stroke-dasharray="4 4"/>`;
      [160, 172, 184].forEach((x, k) => { s += `<circle class="cv-pulse" style="animation-delay:${k * 0.3}s" cx="${x}" cy="49" r="3.2" fill="#8ab4ff"/>`; });
      [72, 86, 100].forEach((x, k) => { s += `<circle class="cv-pulse" style="animation-delay:${k * 0.3 + 0.15}s" cx="${x}" cy="82" r="3.2" fill="none" stroke="#ff8a8a" stroke-width="1.6"/>`; });
      s += `<rect x="112" y="16" width="40" height="104" fill="${W}" fill-opacity=".1"/>`;
      return svg(s);
    },
    // TCAD: 격자 위에 트랜지스터 단면과 등전위선, 수렴하는 잔차
    tcad() {
      let s = "";
      range(9).forEach((i) => { s += `<path d="M${40 + i * 18} 40V122" stroke="${W}" stroke-opacity=".22"/>`; });
      range(6).forEach((j) => { s += `<path d="M40 ${40 + j * 16.4}H184" stroke="${W}" stroke-opacity=".22"/>`; });
      s += `<rect x="92" y="18" width="40" height="18" rx="2" fill="${W}" fill-opacity=".85"/><rect x="88" y="36" width="48" height="4" fill="${W}" fill-opacity=".45"/>`;
      s += `<path d="M40 40c18 0 22 26 36 30s14 8 36 8 22-4 36-8 18-30 36-30V122H40z" fill="${W}" fill-opacity=".14"/>`;
      [0, 12, 24].forEach((d, k) => { s += `<path class="cv-flow" style="animation-delay:${k * 0.2}s" d="M40 ${52 + d}c26 0 30 ${18 + d / 3} 72 ${18 + d / 3}s46-${18 + d / 3} 72-${18 + d / 3}" fill="none" stroke="${W}" stroke-opacity=".75" stroke-width="1.4" stroke-dasharray="5 6"/>`; });
      [14, 9, 5.5, 3, 1.6].forEach((h, k) => { s += `<rect class="cv-grow" x="${10 + k * 5}" y="${112 - h * 4}" width="3.5" height="${h * 4}" fill="${W}" fill-opacity=".7"/>`; });
      return svg(s);
    },
    // 아날로그: 연산 증폭기 기호와 보드 선도, 증폭되어 나오는 사인파
    analog() {
      let s = "";
      range(5).forEach((i) => { s += `<path d="M40 ${24 + i * 22}H190" stroke="${W}" stroke-opacity=".18"/>`; });
      s += `<path d="M40 30H96c20 0 30 10 44 30s28 46 50 56" fill="none" stroke="${W}" stroke-opacity=".55" stroke-width="1.4"/>`;
      s += `<path d="M70 50L70 100L112 75Z" fill="${W}" fill-opacity=".85"/><path d="M60 62H70M60 88H70M112 75H124" stroke="${W}" stroke-width="1.6"/>`;
      s += `<path class="cv-flow" d="M124 75c6-8 10-8 14 0s8 8 14 0 8-8 14 0 8 8 14 0" fill="none" stroke="${W}" stroke-opacity=".8" stroke-width="1.6" stroke-dasharray="5 4"/>`;
      s += `<path class="cv-flow" style="animation-delay:.2s" d="M46 62c2-3 4-3 6 0s4 3 6 0" fill="none" stroke="${W}" stroke-opacity=".7" stroke-width="1.2" stroke-dasharray="3 3"/>`;
      return svg(s);
    },
    // 기본: 다이 격자
    grid() {
      let s = "";
      range(4).forEach((j) => range(8).forEach((i) => { s += `<rect x="${36 + i * 20}" y="${14 + j * 26}" width="16" height="22" rx="2" fill="${W}" fill-opacity=".2" stroke="${W}" stroke-opacity=".4"/>`; }));
      return svg(s);
    },
  };

  window.coverArt = (motif) => (M[motif] || M.grid)();
})();
