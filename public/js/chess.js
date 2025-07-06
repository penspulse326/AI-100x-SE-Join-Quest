class ChessGame {
  constructor() {
    this.gameId = null;
    this.selectedCell = null;
    this.currentPlayer = 'Red';
    this.gameBoard = null;
    this.moveHistory = [];

    this.initializeGame();
    this.setupEventListeners();
  }

  async initializeGame() {
    try {
      const response = await fetch('/chess/new-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      this.gameId = data.gameId;
      this.gameBoard = data.board;

      this.renderBoard();
      this.updateGameInfo();
      this.debug('遊戲初始化完成');
    } catch (error) {
      this.debug('初始化遊戲失敗: ' + error.message);
    }
  }

  setupEventListeners() {
    document.getElementById('new-game').addEventListener('click', () => {
      this.initializeGame();
    });

    document.getElementById('reset-board').addEventListener('click', () => {
      this.resetBoard();
    });
  }

  renderBoard() {
    const boardElement = document.getElementById('chess-board');
    boardElement.innerHTML = '';

    // 創建 10x9 的棋盤 (10行9列)
    for (let row = 1; row <= 10; row++) {
      for (let col = 1; col <= 9; col++) {
        const cell = document.createElement('div');
        cell.className = 'chess-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        // 添加河界樣式
        if (row === 5 || row === 6) {
          cell.classList.add('river');
        }

        cell.addEventListener('click', (e) => this.handleCellClick(e));

        boardElement.appendChild(cell);
      }
    }

    this.updatePieces();
  }

  updatePieces() {
    // 清除所有現有棋子
    document
      .querySelectorAll('.chess-piece')
      .forEach((piece) => piece.remove());

    if (!this.gameBoard) return;

    // 根據 gameBoard 數據放置棋子
    for (let row = 1; row <= 10; row++) {
      for (let col = 1; col <= 9; col++) {
        const piece = this.getPieceAt(row, col);
        if (piece) {
          this.placePieceOnBoard(piece, row, col);
        }
      }
    }
  }

  getPieceAt(row, col) {
    // 從後端返回的棋盤數據中獲取棋子
    if (this.gameBoard && this.gameBoard[`${row},${col}`]) {
      return this.gameBoard[`${row},${col}`];
    }
    return null;
  }

  placePieceOnBoard(pieceName, row, col) {
    const cell = document.querySelector(
      `[data-row="${row}"][data-col="${col}"]`,
    );
    if (!cell) return;

    const pieceElement = document.createElement('div');
    pieceElement.className = 'chess-piece';

    // 設定棋子顏色
    const color = pieceName.split(' ')[0].toLowerCase();
    pieceElement.classList.add(color);

    // 設定棋子文字
    const pieceType = pieceName.split(' ')[1];
    pieceElement.textContent = this.getPieceSymbol(pieceType, color);

    pieceElement.dataset.piece = pieceName;
    pieceElement.dataset.row = row;
    pieceElement.dataset.col = col;

    cell.appendChild(pieceElement);
  }

  getPieceSymbol(type, color) {
    const symbols = {
      red: {
        General: '帥',
        Guard: '仕',
        Elephant: '相',
        Horse: '馬',
        Rook: '車',
        Cannon: '炮',
        Soldier: '兵',
      },
      black: {
        General: '將',
        Guard: '士',
        Elephant: '象',
        Horse: '馬',
        Rook: '車',
        Cannon: '炮',
        Soldier: '卒',
      },
    };

    return symbols[color][type] || type[0];
  }

  async handleCellClick(event) {
    const cell = event.currentTarget;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    const piece = cell.querySelector('.chess-piece');

    if (this.selectedCell) {
      // 如果已有選中的棋子，嘗試移動
      await this.attemptMove(this.selectedCell, { row, col });
      this.clearSelection();
    } else if (piece && this.isPieceMovable(piece)) {
      // 選中棋子
      this.selectCell(cell, piece);
    }
  }

  isPieceMovable(piece) {
    const pieceName = piece.dataset.piece;
    const pieceColor = pieceName.split(' ')[0];
    return pieceColor === this.currentPlayer;
  }

  selectCell(cell, piece) {
    this.clearSelection();
    cell.classList.add('selected');
    this.selectedCell = {
      element: cell,
      piece: piece.dataset.piece,
      row: parseInt(piece.dataset.row),
      col: parseInt(piece.dataset.col),
    };

    this.debug(
      `選中棋子: ${this.selectedCell.piece} 在 (${this.selectedCell.row}, ${this.selectedCell.col})`,
    );
  }

  clearSelection() {
    document.querySelectorAll('.chess-cell').forEach((cell) => {
      cell.classList.remove('selected', 'possible-move');
    });
    this.selectedCell = null;
  }

  async attemptMove(from, to) {
    try {
      const response = await fetch('/chess/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.gameId,
          piece: from.piece,
          fromRow: from.row,
          fromCol: from.col,
          toRow: to.row,
          toCol: to.col,
        }),
      });

      const result = await response.json();

      if (result.success) {
        this.gameBoard = result.board;
        this.updatePieces();
        this.addMoveToHistory(from, to, result);

        if (result.gameOver) {
          this.handleGameEnd(result.winner);
        } else {
          this.currentPlayer = this.currentPlayer === 'Red' ? 'Black' : 'Red';
          this.updateGameInfo();
        }

        this.debug(
          `移動成功: ${from.piece} 從 (${from.row},${from.col}) 到 (${to.row},${to.col})`,
        );
      } else {
        this.debug(`移動失敗: ${result.message}`);
      }
    } catch (error) {
      this.debug('移動請求失敗: ' + error.message);
    }
  }

  addMoveToHistory(from, to, result) {
    const moveItem = document.createElement('div');
    moveItem.className = 'move-item';
    moveItem.textContent = `${this.moveHistory.length + 1}. ${from.piece} (${from.row},${from.col}) -> (${to.row},${to.col})`;

    if (result.gameOver) {
      moveItem.textContent += ` - ${result.winner} 勝利!`;
    }

    document.getElementById('move-list').appendChild(moveItem);
    this.moveHistory.push({ from, to, result });

    // 滾動到最新移動
    const moveList = document.getElementById('move-list');
    moveList.scrollTop = moveList.scrollHeight;
  }

  updateGameInfo() {
    document.getElementById('current-player').textContent =
      this.currentPlayer === 'Red' ? '紅方' : '黑方';
    document.getElementById('game-status').textContent = '進行中';
  }

  handleGameEnd(winner) {
    document.getElementById('game-status').textContent =
      `遊戲結束 - ${winner === 'Red' ? '紅方' : '黑方'} 勝利!`;
    this.debug(`遊戲結束: ${winner} 勝利!`);
  }

  async resetBoard() {
    try {
      const response = await fetch('/chess/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.gameId,
        }),
      });

      const data = await response.json();
      this.gameBoard = data.board;
      this.currentPlayer = 'Red';
      this.moveHistory = [];

      this.updatePieces();
      this.updateGameInfo();
      this.clearSelection();

      // 清除移動歷史
      document.getElementById('move-list').innerHTML = '';

      this.debug('棋盤已重置');
    } catch (error) {
      this.debug('重置棋盤失敗: ' + error.message);
    }
  }

  debug(message) {
    const debugOutput = document.getElementById('debug-output');
    const timestamp = new Date().toLocaleTimeString();
    debugOutput.innerHTML += `<div>[${timestamp}] ${message}</div>`;
    debugOutput.scrollTop = debugOutput.scrollHeight;
  }
}

// 當頁面載入完成後初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
  new ChessGame();
});
