var G = GameGlobal;
var C = G.CONFIG;

function makeCell(val, r, c) {
  var cellObj = { type: 'void', value: 0, used: false, r: r, c: c };
  if (val === 1) {
    cellObj.type = 'empty';
  } else if (val < 0) {
    cellObj.type = 'ice';
    cellObj.hp = Math.abs(val);
  } else if (val >= 10) {
    cellObj.type = 'number';
    cellObj.value = val - 10;
  }
  return cellObj;
}

function attachSeqNumbers(cells, solution) {
  for (var r = 0; r < cells.length; r++) {
    for (var c = 0; c < cells[r].length; c++) {
      var cellObj = cells[r][c];
      for (var si = 0; si < solution.length; si++) {
        if (solution[si].r === r && solution[si].c === c) {
          cellObj.seq = si + 1;
          break;
        }
      }
    }
  }
}

function loadGridData(matrix) {
  G.ROWS = matrix.length;
  G.COLS = matrix[0].length;

  var grid = [];
  for (var r = 0; r < G.ROWS; r++) {
    var row = [];
    for (var c = 0; c < G.COLS; c++) {
      row.push(makeCell(matrix[r][c], r, c));
    }
    grid.push(row);
  }
  attachSeqNumbers(grid, G.currentSolution);

  G.gridData = grid;
  G.initialGridData = G.cloneGrid(grid);
  G.selectedCell = null;
  G.historyStack = [];
  G.markDirty();
}

function generateAndCropLevel() {
  var SIM_SIZE = 8;
  var simGrid = [];
  for (var i = 0; i < SIM_SIZE; i++) {
    simGrid[i] = [];
    for (var j = 0; j < SIM_SIZE; j++) {
      simGrid[i][j] = 0;
    }
  }

  var generatedSteps = [];
  var targetBlocks = Math.floor(Math.random() * 4) + 4;
  var totalOverlapEvents = 0;

  for (var b = 0; b < targetBlocks; b++) {
    var possibleMoves = [];
    for (var r = 0; r < SIM_SIZE; r++) {
      for (var c = 0; c < SIM_SIZE; c++) {
        if (simGrid[r][c] !== 0) continue;
        var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (var di = 0; di < dirs.length; di++) {
          var dir = dirs[di];
          for (var L = 1; L <= 5; L++) {
            var currR = r, currC = c, foundVoids = [], jumpedCount = 0, valid = true;
            while (foundVoids.length < L) {
              currR += dir[0];
              currC += dir[1];
              if (currR < 0 || currR >= SIM_SIZE || currC < 0 || currC >= SIM_SIZE) { valid = false; break; }
              if (simGrid[currR][currC] === 0) {
                foundVoids.push({ r: currR, c: currC });
              } else {
                jumpedCount++;
              }
            }
            if (valid && foundVoids.length === L) {
              var isConnected = (b === 0);
              if (!isConnected) {
                if (jumpedCount > 0) {
                  isConnected = true;
                } else {
                  var adj = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                  for (var ai = 0; ai < adj.length; ai++) {
                    var ar = r + adj[ai][0];
                    var ac = c + adj[ai][1];
                    if (ar >= 0 && ar < SIM_SIZE && ac >= 0 && ac < SIM_SIZE && simGrid[ar][ac] !== 0) {
                      isConnected = true;
                      break;
                    }
                  }
                }
              }
              if (isConnected) {
                possibleMoves.push({ start: { r: r, c: c }, dir: dir, L: L, foundVoids: foundVoids, jumpedCount: jumpedCount });
              }
            }
          }
        }
      }
    }
    if (possibleMoves.length === 0) break;

    possibleMoves.sort(function(a, b) { return b.jumpedCount - a.jumpedCount; });
    var maxJumps = possibleMoves[0].jumpedCount;
    var topMoves = [];
    for (var mi = 0; mi < possibleMoves.length; mi++) {
      if (possibleMoves[mi].jumpedCount >= Math.max(0, maxJumps - 1)) {
        topMoves.push(possibleMoves[mi]);
      }
    }
    var chosenMove = topMoves[Math.floor(Math.random() * topMoves.length)];

    if (chosenMove.jumpedCount > 0) totalOverlapEvents += 1;

    simGrid[chosenMove.start.r][chosenMove.start.c] = 10 + chosenMove.L;
    for (var vi = 0; vi < chosenMove.foundVoids.length; vi++) {
      var v = chosenMove.foundVoids[vi];
      simGrid[v.r][v.c] = 1;
    }

    generatedSteps.push({ r: chosenMove.start.r, c: chosenMove.start.c, val: chosenMove.L, dir: chosenMove.dir[0] + ',' + chosenMove.dir[1], foundVoids: chosenMove.foundVoids });
  }

  var diffScore = (generatedSteps.length * 1.5) + (totalOverlapEvents * 3.0);
  if (diffScore <= 13) {
    G.difficulty = 'EASY';
    G.difficultyColor = C.diffEasy;
  } else if (diffScore <= 20) {
    G.difficulty = 'MEDIUM';
    G.difficultyColor = C.diffMedium;
  } else {
    G.difficulty = 'HARD';
    G.difficultyColor = C.diffHard;
  }

  var minR = SIM_SIZE, maxR = -1, minC = SIM_SIZE, maxC = -1;
  for (var r = 0; r < SIM_SIZE; r++) {
    for (var c = 0; c < SIM_SIZE; c++) {
      if (simGrid[r][c] !== 0) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  var croppedGrid = [];
  for (var r = minR; r <= maxR; r++) {
    var row = [];
    for (var c = minC; c <= maxC; c++) {
      row.push(simGrid[r][c]);
    }
    croppedGrid.push(row);
  }

  for (var si = 0; si < generatedSteps.length; si++) {
    var s = generatedSteps[si];
    s.r -= minR;
    s.c -= minC;
    if (s.foundVoids) {
      for (var vi2 = 0; vi2 < s.foundVoids.length; vi2++) {
        s.foundVoids[vi2].r -= minR;
        s.foundVoids[vi2].c -= minC;
      }
    }
  }
  G.currentSolution = generatedSteps;

  loadGridData(croppedGrid);
  if (G.currentMode === 'advanced') applyIceObstacles();
}

function getAttackerCandidates(targetR, targetC) {
  var candidates = [];
  var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (var di = 0; di < dirs.length; di++) {
    var dr = dirs[di][0], dc = dirs[di][1];
    var r = targetR + dr, c = targetC + dc;
    while (r >= 0 && r < G.ROWS && c >= 0 && c < G.COLS) {
      var cell = G.gridData[r][c];
      if (cell.type === 'empty' || cell.type === 'ice') break;
      if (cell.type === 'void') {
        candidates.push({ r: r, c: c, dir: (-dr) + ',' + (-dc) });
        break;
      }
      r += dr; c += dc;
    }
  }
  return candidates;
}

function applyIceObstacles() {
  var maxIce = Math.floor(Math.random() * 3) + 2;
  var iceAdded = 0;
  var shuffledSteps = G.currentSolution.slice().sort(function() { return Math.random() - 0.5; });
  var extraSteps = [];

  for (var si = 0; si < shuffledSteps.length; si++) {
    var step = shuffledSteps[si];
    if (iceAdded >= maxIce) break;
    if (step.foundVoids && step.foundVoids.length > 0) {
      var target = step.foundVoids[Math.floor(Math.random() * step.foundVoids.length)];
      var cell = G.gridData[target.r][target.c];

      if (cell.type === 'empty') {
        var candidates = getAttackerCandidates(target.r, target.c);
        var isMulti = candidates.length > 0 && Math.random() > 0.3;

        if (isMulti) {
          candidates.sort(function() { return Math.random() - 0.5; });
          var isTriple = candidates.length >= 2 && Math.random() > 0.4;

          if (isTriple) {
            var a1 = candidates[0], a2 = candidates[1];
            G.gridData[a1.r][a1.c] = makeCell(11, a1.r, a1.c);
            G.gridData[a2.r][a2.c] = makeCell(11, a2.r, a2.c);
            cell.type = 'ice';
            cell.hp = 3;

            var sourceCell = G.gridData[step.r][step.c];
            sourceCell.value += 1;
            step.val += 1;

            extraSteps.push({ r: a1.r, c: a1.c, val: 1, dir: a1.dir });
            extraSteps.push({ r: a2.r, c: a2.c, val: 1, dir: a2.dir });
          } else {
            var a1 = candidates[0];
            var aVal = Math.floor(Math.random() * 2) + 1;
            G.gridData[a1.r][a1.c] = makeCell(10 + aVal, a1.r, a1.c);
            cell.type = 'ice';
            cell.hp = aVal + 1;

            var sourceCell = G.gridData[step.r][step.c];
            sourceCell.value += 1;
            step.val += 1;

            extraSteps.push({ r: a1.r, c: a1.c, val: aVal, dir: a1.dir });
          }
        } else {
          var hp = Math.floor(Math.random() * 3) + 1;
          cell.type = 'ice';
          cell.hp = hp;

          var sourceCell = G.gridData[step.r][step.c];
          sourceCell.value += hp;
          step.val += hp;
        }
        iceAdded++;
      }
    }
  }

  G.currentSolution = extraSteps.concat(G.currentSolution);

  attachSeqNumbers(G.gridData, G.currentSolution);
  G.initialGridData = G.cloneGrid(G.gridData);
  G.markDirty();
}

module.exports = {
  loadGridData: loadGridData,
  generateAndCropLevel: generateAndCropLevel,
  getAttackerCandidates: getAttackerCandidates,
  applyIceObstacles: applyIceObstacles
};
