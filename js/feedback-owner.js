/* A private capability for this browser, separate from the public likes visitor ID. */
globalThis.FeedbackOwner = (() => {
  const key = 'feedback-owner-key';
  const valid = value => /^[0-9a-f]{64}$/.test(value || '');
  let memory = '', persistent = false;
  function get(create = false) {
    try {
      const saved = localStorage.getItem(key);
      if (valid(saved)) { memory = saved; persistent = true; return memory; }
      // Respect explicit browser data clearing rather than restoring a deleted key.
      if (persistent) memory = '';
      persistent = false;
    } catch { persistent = false; }
    if (!memory && create) {
      memory = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
      try { localStorage.setItem(key, memory); persistent = localStorage.getItem(key) === memory; } catch {}
    }
    return memory;
  }
  return { headers(create = false) { const token = get(create); return token ? { 'X-Feedback-Owner': token } : {}; },
    isPersistent: () => persistent };
})();
