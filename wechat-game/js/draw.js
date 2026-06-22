function drawRoundRect(ctx, x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawText(ctx, text, x, y, size, color, align, bold) {
  ctx.font = (bold ? 'bold ' : '') + size + 'px sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawShadowBox(ctx, x, y, w, h, r, color) {
  ctx.shadowColor = 'rgba(122, 139, 152, 0.12)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  drawRoundRect(ctx, x, y, w, h, r, color);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawCircle(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function measureText(ctx, text, size) {
  ctx.font = size + 'px sans-serif';
  return ctx.measureText(text).width;
}

function wrapText(ctx, text, maxWidth, lineHeight, size) {
  ctx.font = size + 'px sans-serif';
  var words = text.split('');
  var lines = [];
  var currentLine = '';
  for (var i = 0; i < words.length; i++) {
    var testLine = currentLine + words[i];
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

module.exports = {
  drawRoundRect: drawRoundRect,
  drawText: drawText,
  drawShadowBox: drawShadowBox,
  drawCircle: drawCircle,
  measureText: measureText,
  wrapText: wrapText
};