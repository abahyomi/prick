// Posición de la última foto clicada — usada por PhotoDetail para
// animar la apertura desde el sitio exacto donde se hizo click.
let _last = null

export function setLastClickRect(rect) {
  _last = rect
}

export function consumeLastClickRect() {
  const r = _last
  _last = null
  return r
}
