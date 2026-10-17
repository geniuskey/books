/* Progressive layout controls; the native form and filters remain the fallback. */
(() => {
  const composer = document.getElementById('feedback-compose');
  const wide = matchMedia('(min-width: 1000px)');
  // Open at desktop widths once, without resetting a reader's choice on resize.
  if (wide.matches) composer.open = true;

  const filter = document.getElementById('inbox-type');
  const tabs = document.querySelector('.inbox-type-tabs');
  tabs.hidden = false;
  document.getElementById('inbox-type-label').hidden = true;
  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-inbox-type]');
    if (!button || button.getAttribute('aria-pressed') === 'true') return;
    filter.value = button.dataset.inboxType;
    tabs.querySelectorAll('button').forEach((tab) => tab.setAttribute('aria-pressed', String(tab === button)));
    filter.dispatchEvent(new Event('change', { bubbles: true }));
  });

  const visibility = document.getElementById('feedback-form').elements.visibility;
  const privacy = document.getElementById('feedback-privacy');
  const updatePrivacy = () => {
    privacy.textContent = visibility.value === 'public'
      ? '게시판에 공개됩니다. 개인 정보는 적지 마세요.'
      : '비공개 글은 저자와 나만 봅니다. 작성한 브라우저의 ‘내 글’에서 확인하세요.';
  };
  visibility.addEventListener('change', updatePrivacy);
  updatePrivacy();
})();
