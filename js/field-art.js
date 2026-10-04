/* 홈 분야 카드: 분야 색과 테마를 따르는 작은 SVG 일러스트. */
(() => {
  "use strict";
  const drawings = {
    computing: `<rect x="21" y="28" width="86" height="61" rx="7" class="fa-paper"/>
      <path d="M21 41h86M56 90v12m16-12v12M43 103h42"/>
      <path d="m45 54-10 10 10 10m38-20 10 10-10 10M69 51 59 77" class="fa-accent"/>
      <circle cx="29" cy="35" r="1.5" class="fa-solid"/><circle cx="36" cy="35" r="1.5" class="fa-solid"/>`,
    ai: `<path d="m30 36 34-10 34 24-34 18-34-32Zm0 0v51l34 17 34-19V50M30 87l34-19v36M64 26v42l34 17" class="fa-muted"/>
      <path d="m30 36 34 32 34-18M30 87l34-19 34 17" class="fa-accent"/>
      <circle cx="30" cy="36" r="8" class="fa-paper"/><circle cx="64" cy="26" r="7" class="fa-paper"/>
      <circle cx="98" cy="50" r="8" class="fa-paper"/><circle cx="30" cy="87" r="8" class="fa-paper"/>
      <circle cx="98" cy="85" r="8" class="fa-paper"/><circle cx="64" cy="104" r="7" class="fa-paper"/>
      <circle cx="64" cy="68" r="12" class="fa-tint"/><path d="m61 61-3 8h8l-3 7" class="fa-accent"/>`,
    electronics: `<path d="M29 54V34h21m28 0h20v20" class="fa-muted"/>
      <circle cx="29" cy="54" r="3" class="fa-paper"/><circle cx="98" cy="54" r="3" class="fa-paper"/>
      <rect x="52" y="22" width="24" height="27" rx="4" class="fa-paper"/><path d="m65 27-6 9h9l-5 8" class="fa-accent"/>
      <path d="m24 76 10-19h51l15 19 7 5v15H21V82Zm0 0h76M59 58v18" class="fa-paper"/>
      <path d="M27 85h9m55 0h9" class="fa-accent"/>
      <circle cx="39" cy="96" r="9" class="fa-paper"/><circle cx="89" cy="96" r="9" class="fa-paper"/>
      <circle cx="39" cy="96" r="3" class="fa-solid"/><circle cx="89" cy="96" r="3" class="fa-solid"/>`,
    money: `<path d="M25 85V30m0 55h78" class="fa-muted"/>
      <path d="m34 64 19-16 16 6 28-27m-15 0h15v15" class="fa-accent"/>
      <path d="M40 79V68m17 11V62m17 17V65m17 14V52" class="fa-muted"/>
      <rect x="24" y="91" width="34" height="12" rx="6" class="fa-paper"/>
      <rect x="24" y="81" width="34" height="12" rx="6" class="fa-paper"/>
      <circle cx="84" cy="91" r="19" class="fa-tint"/>
      <path d="m74 85 4 13 6-13 6 13 4-13m-23 5h26" class="fa-accent"/>`,
    housing: `<path d="M88 45V28h12v29" class="fa-tint"/>
      <path d="m20 61 44-37 44 37M29 55v49h70V55" class="fa-paper"/>
      <rect x="41" y="64" width="17" height="17" rx="2" class="fa-tint"/><path d="M49.5 64v17M41 72.5h17"/>
      <path d="M70 104V72h17v32" class="fa-tint"/><circle cx="81" cy="87" r="1.5" class="fa-solid"/>
      <path d="M20 105h88" class="fa-muted"/>`,
    law: `<path d="M26 55V24h43l13 13v65H26V88" class="fa-paper"/>
      <path d="M68 24v15h14M37 40h18m-18 9h18m-18 40h20m-20 7h30" class="fa-muted"/>
      <path d="M78 47v52m-14 1h28M52 59l52-8M53 59 42 79h22L53 59Zm49-8L91 71h22l-11-20Z"/>
      <path d="M42 79q11 15 22 0M91 71q11 15 22 0" class="fa-tint"/>
      <circle cx="78" cy="47" r="4" class="fa-solid"/>`,
    health: `<path d="M64 104 29 70C7 47 36 18 56 38l8 8 8-8c20-20 49 9 27 32Z" class="fa-tint"/>
      <path d="M21 68h23l8-17 13 34 10-23 6 6h26" class="fa-accent"/>
      <path d="M98 23v14m-7-7h14" class="fa-muted"/>`,
    culture: `<path d="M84 48V25l22-5v24M84 31l22-5" class="fa-accent"/>
      <ellipse cx="78" cy="49" rx="6" ry="4" class="fa-tint"/><ellipse cx="100" cy="45" rx="6" ry="4" class="fa-tint"/>
      <path d="M22 59h15l6-10h24l6 10h22a6 6 0 0 1 6 6v32a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6V65a6 6 0 0 1 6-6Z" class="fa-paper"/>
      <circle cx="59" cy="80" r="17" class="fa-tint"/><circle cx="59" cy="80" r="10"/>
      <path d="M85 68h7M28 28v12m-6-6h12m9-15v8m-4-4h8" class="fa-accent"/>`,
  };
  EB.fieldArt = (field) => {
    if (field.id === "semiconductor") return EB.miniWafer(field.books);
    const drawing = drawings[field.id];
    if (!drawing) return "";
    return `<svg class="field-art" viewBox="0 0 128 128" aria-hidden="true" focusable="false"><circle cx="64" cy="64" r="59" class="fa-backdrop"/><g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`;
  };
})();
