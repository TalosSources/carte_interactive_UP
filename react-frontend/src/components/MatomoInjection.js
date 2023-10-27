export function injectMatomo () {
  const _mtm = window._mtm = window._mtm ?? []
  _mtm.push({ 'mtm.startTime': (new Date().getTime()), event: 'mtm.Start' });
  (function () {
    const d = document; const g = d.createElement('script'); const s = d.getElementsByTagName('script')[0]
    g.async = true; g.src = 'https://matomo.entrop.mywire.org/js/container_NHVd6Av8.js'; s.parentNode?.insertBefore(g, s)
  })()
}
