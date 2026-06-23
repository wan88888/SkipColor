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

function getMaxScroll(screen) {
  var contentH = (G._screenContentHeight && G._screenContentHeight[screen]) || 0;
  var viewH = G.H - 110;
  return Math.max(0, contentH - viewH);
}

function clamp(screen, value) {
  return Math.max(0, Math.min(getMaxScroll(screen), value));
}

function applyScroll(screen, deltaY) {
  G.screenScroll[screen] = clamp(screen, getOffset(screen) + deltaY);
  G.markDirty();
}

function beginDraw(ctx, screen) {
  var offset = getOffset(screen);
  var viewTop = 110;
  var viewH = G.H - viewTop;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, viewTop, G.W, viewH);
  ctx.clip();
  ctx.translate(0, -offset);
  return { offset: offset, viewTop: viewTop };
}

function endDraw(ctx) {
  ctx.restore();
}

function adjustButtonY(screen, btn) {
  var viewTop = 110;
  var offset = getOffset(screen);
  return {
    x: btn.x,
    y: viewTop + btn.y - offset,
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
