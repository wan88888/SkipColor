function parseDir(dirStr) {
  var parts = dirStr.split(',');
  return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
}

function findOtherPortal(grid, portalId, excludeR, excludeC, rows, cols) {
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      if (r === excludeR && c === excludeC) continue;
      var cell = grid[r][c];
      if (cell.type === 'portal' && cell.portalId === portalId) {
        return { r: r, c: c };
      }
    }
  }
  return null;
}

function reflectDirection(dr, dc, mirrorDir) {
  if (mirrorDir === '/') {
    return [-dc, -dr];
  }
  return [dc, dr];
}

function explodeBombOnGrid(grid, r, c, radius, rows, cols) {
  for (var dr = -radius; dr <= radius; dr++) {
    for (var dc = -radius; dc <= radius; dc++) {
      var nr = r + dr;
      var nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      var cell = grid[nr][nc];
      if (nr === r && nc === c) {
        cell.type = 'filled';
        continue;
      }
      if (cell.type === 'ice') {
        cell.type = 'empty';
        delete cell.hp;
      } else if (cell.type === 'empty') {
        cell.type = 'filled';
      }
    }
  }
}

function simBeam(grid, startR, startC, dr, dc, targetCount, rows, cols) {
  var cell = grid[startR][startC];
  if (cell.type !== 'number' || cell.used) return false;
  cell.used = true;

  var filledCount = 0;
  var currR = startR;
  var currC = startC;
  var origDr = dr;
  var origDc = dc;
  var depth = 0;

  while (filledCount < targetCount && depth < 200) {
    depth++;
    currR += dr;
    currC += dc;
    if (currR < 0 || currR >= rows || currC < 0 || currC >= cols) return false;

    var targetCell = grid[currR][currC];
    if (targetCell.type === 'void' || targetCell.type === 'filled' || targetCell.type === 'number') {
      continue;
    }
    if (targetCell.type === 'portal') {
      var otherPortal = findOtherPortal(grid, targetCell.portalId, currR, currC, rows, cols);
      if (!otherPortal) return false;
      currR = otherPortal.r;
      currC = otherPortal.c;
      dr = origDr;
      dc = origDc;
      continue;
    }
    if (targetCell.type === 'mirror') {
      var reflected = reflectDirection(dr, dc, targetCell.mirrorDir);
      dr = reflected[0];
      dc = reflected[1];
      origDr = dr;
      origDc = dc;
      continue;
    }
    if (targetCell.type === 'bomb') {
      explodeBombOnGrid(grid, currR, currC, targetCell.bombRadius || 1, rows, cols);
      filledCount++;
      continue;
    }
    if (targetCell.type === 'empty') {
      targetCell.type = 'filled';
      filledCount++;
      continue;
    }
    if (targetCell.type === 'ice') {
      targetCell.hp--;
      filledCount++;
      if (targetCell.hp <= 0) {
        targetCell.type = 'empty';
        delete targetCell.hp;
      }
      continue;
    }
    return false;
  }

  return filledCount >= targetCount;
}

function validateSolutionOnGrid(grid, solution, cloneGrid) {
  if (!solution || solution.length === 0) return false;

  var simGrid = cloneGrid(grid);
  var rows = simGrid.length;
  var cols = simGrid[0].length;

  for (var i = 0; i < solution.length; i++) {
    var step = solution[i];
    var dir = parseDir(step.dir);
    var cell = simGrid[step.r][step.c];
    if (cell.type !== 'number') return false;
    if (!simBeam(simGrid, step.r, step.c, dir[0], dir[1], cell.value, rows, cols)) {
      return false;
    }
  }

  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var type = simGrid[r][c].type;
      if (type === 'empty' || type === 'ice') return false;
    }
  }
  return true;
}

module.exports = {
  parseDir: parseDir,
  findOtherPortal: findOtherPortal,
  reflectDirection: reflectDirection,
  explodeBombOnGrid: explodeBombOnGrid,
  simBeam: simBeam,
  validateSolutionOnGrid: validateSolutionOnGrid
};
