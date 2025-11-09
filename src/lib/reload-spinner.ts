// Lightweight full-screen overlay spinner shown right before hard reloads
export function showReloadSpinner(message?: string) {
  try {
    const existing = document.getElementById('reload-overlay');
    if (existing) return;
    const el = document.createElement('div');
    el.id = 'reload-overlay';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'Loading');
    el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.zIndex = '2147483646';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.background = 'var(--mui-palette-background-default, rgba(255,255,255,0.75))';
    el.style.backdropFilter = 'blur(2px)';
    el.style.opacity = '0';
    el.style.transition = 'opacity 180ms ease';

    const box = document.createElement('div');
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.alignItems = 'center';
    box.style.gap = '10px';

    const logo = document.createElement('img');
    logo.src = '/icon.png';
    logo.alt = 'logo';
    logo.width = 28;
    logo.height = 28;
    logo.style.display = 'block';

    const spinner = document.createElement('div');
    spinner.style.width = '28px';
    spinner.style.height = '28px';
    spinner.style.border = '3px solid rgba(0,0,0,0.1)';
    // brand-ish azure
    spinner.style.borderTopColor = '#52A8FF';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'reload-spin 0.8s linear infinite';

    const text = document.createElement('div');
    // Auto message by document language if none provided
    const docLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    const fallback = docLang.startsWith('fa') ? 'در حال بارگذاری…' : 'Loading…';
    text.textContent = message || fallback;
    text.style.fontFamily = "system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Arial,'Noto Sans',sans-serif";
    text.style.fontSize = '12px';
    text.style.color = 'rgba(0,0,0,0.6)';

    const style = document.createElement('style');
    style.textContent = '@keyframes reload-spin { to { transform: rotate(360deg); } }';

    box.appendChild(logo);
    box.appendChild(spinner);
    box.appendChild(text);
    el.appendChild(style);
    el.appendChild(box);
    document.body.appendChild(el);
    // fade-in
    requestAnimationFrame(() => { el.style.opacity = '1'; });
  } catch {
    // no-op
  }
}

export default showReloadSpinner;
