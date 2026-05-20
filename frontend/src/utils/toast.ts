export type ToastType = 'info' | 'success' | 'warn' | 'error';

const activeToasts: HTMLElement[] = [];

function removeToast(el: HTMLElement) {
  el.classList.add('toast-exit');
  setTimeout(() => {
    el.remove();
    const idx = activeToasts.indexOf(el);
    if (idx >= 0) activeToasts.splice(idx, 1);
  }, 300);
}

export function toast(msg: string, type: ToastType = 'info', dur: number = 2500) {
  const existing = activeToasts.find(t => t.textContent === msg);
  if (existing) {
    clearTimeout((existing as any)._timer);
    (existing as any)._timer = setTimeout(() => removeToast(existing), dur);
    return;
  }

  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  activeToasts.push(t);

  requestAnimationFrame(() => t.classList.add('toast-enter'));

  (t as any)._timer = setTimeout(() => removeToast(t), dur);
}
