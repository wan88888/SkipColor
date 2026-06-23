var G = GameGlobal;

function reset(screen) {
  if (!G.screenScroll) G.screenScroll = {};
  G.screenScroll[screen] = 0;
  G._screenContentHeight = G._screenContentHeight || {};
  G._screenContentHeight[screen] = 0;
}

function getOffset(screen) {
  if (!G.screenScroll) G.screenScroll = {};
  return G.screenScroll[screen] || 0;
}

function setContentHeight(screen, height) {
  G._screenContentHeight = G._screenContentHeight || {};
  G._screenContentHeight[screen] = height;
}

function getViewMetrics() {
  var pad = G.layoutPad || { scrollHeader: 110, bottom: 16 };
  var viewTop = pad.scrollHeader;
  var viewH = G.H - viewTop - pad.bottom;
  return { viewTop: viewTop, viewH: viewH };
}

function getMaxScroll(screen) {
  var metrics = getViewMetrics();
  var contentH = (G._screenContentHeight && G._screenContentHeight[screen]) || 0;
  return Math.max(0, contentH - metrics.viewH);
}

function clamp(screen, value) {
  return Math.max(0, Math.min(getMaxScroll(screen), value));
}

function applyScroll(screen, deltaY) {
  G.screenScroll[screen] = clamp(screen, getOffset(screen) + deltaY);
  G.markDirty();
}

function beginDraw(ctx, screen) {
  var metrics = getViewMetrics();
  var offset = getOffset(screen);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, metrics.viewTop, G.W, metrics.viewH);
  ctx.clip();
  ctx.translate(0, -offset);
  return { offset: offset, viewTop: metrics.viewTop };
}

function endDraw(ctx) {
  ctx.restore();
}

function adjustButtonY(screen, btn) {
  var metrics = getViewMetrics();
  var offset = getOffset(screen);
  return {
    x: btn.x,
    y: metrics.viewTop + btn.y - offset,
    w: btn.w,
    h: btn.h,
    action: btn.action
  };
}

function isScrollable(screen) {
  return screen === 'home' || screen === 'achievements';
}

module.exports = {
  reset: reset,
  getOffset: getOffset,
  setContentHeight: setContentHeight,
  getMaxScroll: getMaxScroll,
  applyScroll: applyScroll,
  beginDraw: beginDraw,
  endDraw: endDraw,
  adjustButtonY: adjustButtonY,
  isScrollable: isScrollable
};
