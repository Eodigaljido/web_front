/** CustomOverlay: xAnchor 0.5, yAnchor 1 — 하단 핀 끝이 좌표에 맞도록 (transform 사용 안 함) */
export function createStopMarkerContent(index: number, total: number, label: string): HTMLElement {
  const isStart = index === 0;
  const isEnd = index === total - 1;

  const root = document.createElement('div');
  root.className = 'course-map-marker';
  root.style.cssText = [
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'pointer-events:none',
    'line-height:1',
  ].join(';');

  const caption = document.createElement('div');
  caption.style.cssText = [
    'margin-bottom:4px',
    'max-width:120px',
    'padding:2px 6px',
    'border-radius:4px',
    'background:rgba(255,255,255,.92)',
    'color:#1e293b',
    'font:500 10px/1.3 system-ui,sans-serif',
    'white-space:nowrap',
    'overflow:hidden',
    'text-overflow:ellipsis',
    'box-shadow:0 1px 3px rgba(0,0,0,.15)',
  ].join(';');
  caption.textContent = label;

  const pin = document.createElement('div');
  pin.style.cssText = [
    'min-width:26px',
    'height:26px',
    'padding:0 6px',
    'border-radius:13px',
    'background:' + (isStart ? '#16a34a' : isEnd ? '#dc2626' : '#2563eb'),
    'color:#fff',
    'font:700 12px/26px system-ui,sans-serif',
    'text-align:center',
    'box-shadow:0 2px 6px rgba(0,0,0,.25)',
  ].join(';');
  pin.textContent = isStart ? '출' : isEnd ? '도' : String(index);

  root.append(caption, pin);
  return root;
}
