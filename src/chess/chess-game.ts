import { ChessBoard } from './chess-board';

export class ChessGame {
  private board: ChessBoard;
  private gameOver: boolean = false;
  private winner: string | undefined;

  constructor(board: ChessBoard) {
    this.board = board;
  }

  makeMove(
    piece: string,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): { legal: boolean; winner?: string; gameOver?: boolean } {
    // 檢查該位置是否真的有這個棋子
    const actualPiece = this.board.getPiece(fromRow, fromCol);
    if (actualPiece !== piece) {
      return { legal: false, winner: this.winner, gameOver: this.gameOver };
    }

    // 檢查移動是否合法
    const isLegal = this.isLegalMove(piece, fromRow, fromCol, toRow, toCol);
    if (!isLegal) {
      return { legal: false, winner: this.winner, gameOver: this.gameOver };
    }

    // 檢查是否會吃掉對方的將軍
    const capturedPiece = this.board.getPiece(toRow, toCol);
    const isCapturingGeneral =
      capturedPiece && capturedPiece.includes('General');

    // 執行移動
    this.board.removePiece(fromRow, fromCol);
    this.board.placePiece(piece, toRow, toCol);

    // 檢查遊戲是否結束
    if (isCapturingGeneral) {
      this.gameOver = true;
      this.winner = piece.split(' ')[0]; // 取得顏色部分
    } else {
      this.checkGameEnd();
    }

    return {
      legal: true,
      winner: this.winner,
      gameOver: this.gameOver,
    };
  }

  private isLegalMove(
    piece: string,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): boolean {
    // 檢查目標位置是否被自己的棋子佔據
    const targetPiece = this.board.getPiece(toRow, toCol);
    if (targetPiece && this.isSameColor(piece, targetPiece)) {
      return false;
    }

    // 根據棋子類型檢查移動規則
    if (piece === 'Red General' || piece === 'Black General') {
      return this.isValidGeneralMove(fromRow, fromCol, toRow, toCol);
    }

    if (piece === 'Red Guard' || piece === 'Black Guard') {
      return this.isValidGuardMove(fromRow, fromCol, toRow, toCol);
    }

    if (piece === 'Red Rook' || piece === 'Black Rook') {
      return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
    }

    if (piece === 'Red Horse' || piece === 'Black Horse') {
      return this.isValidHorseMove(fromRow, fromCol, toRow, toCol);
    }

    if (piece === 'Red Cannon' || piece === 'Black Cannon') {
      return this.isValidCannonMove(fromRow, fromCol, toRow, toCol);
    }

    if (piece === 'Red Elephant' || piece === 'Black Elephant') {
      return this.isValidElephantMove(fromRow, fromCol, toRow, toCol);
    }

    if (piece === 'Red Soldier' || piece === 'Black Soldier') {
      return this.isValidSoldierMove(fromRow, fromCol, toRow, toCol);
    }

    // 其他棋子類型待實作
    return false;
  }

  private isSameColor(piece1: string, piece2: string): boolean {
    const piece1Color = piece1.split(' ')[0];
    const piece2Color = piece2.split(' ')[0];
    return piece1Color === piece2Color;
  }

  private isValidGeneralMove(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): boolean {
    // 取得當前棋子
    const piece = this.board.getPiece(fromRow, fromCol);
    if (!piece) {
      return false;
    }
    const isRed = piece.includes('Red');

    // 檢查是否在相應的宮殿內
    if (isRed) {
      // 檢查是否在紅方宮殿內 (1-3, 4-6)
      if (
        !this.isInRedPalace(fromRow, fromCol) ||
        !this.isInRedPalace(toRow, toCol)
      ) {
        return false;
      }
    } else {
      // 檢查是否在黑方宮殿內 (8-10, 4-6)
      if (
        !this.isInBlackPalace(fromRow, fromCol) ||
        !this.isInBlackPalace(toRow, toCol)
      ) {
        return false;
      }
    }

    // 檢查是否只移動一格，且為垂直或水平移動
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    if (
      !((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))
    ) {
      return false;
    }

    // 檢查將軍對將軍規則：移動後不能讓兩個將軍在同一條直線上
    if (this.wouldGeneralsFaceEachOther(toRow, toCol)) {
      return false;
    }

    return true;
  }

  private wouldGeneralsFaceEachOther(
    generalRow: number,
    generalCol: number,
  ): boolean {
    // 找到另一方將軍的位置
    const redGeneral = this.findPiece('Red General');
    const blackGeneral = this.findPiece('Black General');

    if (!redGeneral || !blackGeneral) {
      return false;
    }

    // 確定哪個將軍在移動
    let otherGeneral: { row: number; col: number };
    if (generalRow === redGeneral.row && generalCol === redGeneral.col) {
      // 如果是紅方將軍在移動，檢查與黑方將軍的關係
      otherGeneral = blackGeneral;
    } else if (
      generalRow === blackGeneral.row &&
      generalCol === blackGeneral.col
    ) {
      // 如果是黑方將軍在移動，檢查與紅方將軍的關係
      otherGeneral = redGeneral;
    } else {
      // 當前位置沒有將軍，檢查移動後的位置
      const redGeneralAfterMove =
        generalRow >= 1 && generalRow <= 3
          ? { row: generalRow, col: generalCol }
          : redGeneral;
      const blackGeneralAfterMove =
        generalRow >= 8 && generalRow <= 10
          ? { row: generalRow, col: generalCol }
          : blackGeneral;

      // 檢查是否在同一列
      if (redGeneralAfterMove.col === blackGeneralAfterMove.col) {
        // 檢查兩個將軍之間是否有其他棋子
        const minRow = Math.min(
          redGeneralAfterMove.row,
          blackGeneralAfterMove.row,
        );
        const maxRow = Math.max(
          redGeneralAfterMove.row,
          blackGeneralAfterMove.row,
        );

        for (let row = minRow + 1; row < maxRow; row++) {
          if (!this.board.isEmpty(row, redGeneralAfterMove.col)) {
            return false; // 中間有棋子，不違規
          }
        }
        return true; // 中間沒有棋子，違規
      }
      return false;
    }

    // 檢查是否在同一列
    if (generalCol === otherGeneral.col) {
      // 檢查兩個將軍之間是否有其他棋子
      const minRow = Math.min(generalRow, otherGeneral.row);
      const maxRow = Math.max(generalRow, otherGeneral.row);

      for (let row = minRow + 1; row < maxRow; row++) {
        if (!this.board.isEmpty(row, generalCol)) {
          return false; // 中間有棋子，不違規
        }
      }
      return true; // 中間沒有棋子，違規
    }

    return false;
  }

  private findPiece(pieceName: string): { row: number; col: number } | null {
    for (let row = 1; row <= 10; row++) {
      for (let col = 1; col <= 9; col++) {
        if (this.board.getPiece(row, col) === pieceName) {
          return { row, col };
        }
      }
    }
    return null;
  }

  private isInRedPalace(row: number, col: number): boolean {
    return row >= 1 && row <= 3 && col >= 4 && col <= 6;
  }

  private isInBlackPalace(row: number, col: number): boolean {
    return row >= 8 && row <= 10 && col >= 4 && col <= 6;
  }

  private isValidGuardMove(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): boolean {
    // 取得當前棋子
    const piece = this.board.getPiece(fromRow, fromCol);
    if (!piece) {
      return false;
    }
    const isRed = piece.includes('Red');

    // 檢查是否在相應的宮殿內
    if (isRed) {
      // 檢查是否在紅方宮殿內 (1-3, 4-6)
      if (
        !this.isInRedPalace(fromRow, fromCol) ||
        !this.isInRedPalace(toRow, toCol)
      ) {
        return false;
      }
    } else {
      // 檢查是否在黑方宮殿內 (8-10, 4-6)
      if (
        !this.isInBlackPalace(fromRow, fromCol) ||
        !this.isInBlackPalace(toRow, toCol)
      ) {
        return false;
      }
    }

    // 檢查是否為斜對角移動一格
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    return rowDiff === 1 && colDiff === 1;
  }

  private isValidRookMove(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): boolean {
    // 檢查是否為直線移動（垂直或水平）
    if (fromRow !== toRow && fromCol !== toCol) {
      return false;
    }

    // 檢查路徑是否暢通
    return this.isPathClear(fromRow, fromCol, toRow, toCol);
  }

  private isPathClear(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): boolean {
    const rowDirection = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colDirection = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

    let currentRow = fromRow + rowDirection;
    let currentCol = fromCol + colDirection;

    while (currentRow !== toRow || currentCol !== toCol) {
      if (!this.board.isEmpty(currentRow, currentCol)) {
        return false; // 路徑被阻擋
      }
      currentRow += rowDirection;
      currentCol += colDirection;
    }

    return true; // 路徑暢通
  }

  private isValidHorseMove(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): boolean {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    // 檢查是否為 L 型移動
    const isLShape =
      (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
      (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);

    if (!isLShape) {
      return false;
    }

    // 檢查是否被 "蹩馬腿"
    let blockingRow: number;
    let blockingCol: number;

    if (Math.abs(rowDiff) === 2) {
      // 先走行再走列
      blockingRow = fromRow + (rowDiff > 0 ? 1 : -1);
      blockingCol = fromCol;
    } else {
      // 先走列再走行
      blockingRow = fromRow;
      blockingCol = fromCol + (colDiff > 0 ? 1 : -1);
    }

    // 如果阻擋點有棋子，則不能移動
    return this.board.isEmpty(blockingRow, blockingCol);
  }

  private isValidCannonMove(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): boolean {
    // 檢查是否為直線移動（垂直或水平）
    if (fromRow !== toRow && fromCol !== toCol) {
      return false;
    }

    const targetPiece = this.board.getPiece(toRow, toCol);

    if (!targetPiece) {
      // 移動到空位，像 Rook 一樣，路徑必須暢通
      return this.isPathClear(fromRow, fromCol, toRow, toCol);
    } else {
      // 攻擊敵方棋子，必須跳過恰好一個棋子（炮架）
      const screensCount = this.countScreens(fromRow, fromCol, toRow, toCol);
      return screensCount === 1;
    }
  }

  private countScreens(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): number {
    const rowDirection = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colDirection = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

    let currentRow = fromRow + rowDirection;
    let currentCol = fromCol + colDirection;
    let screenCount = 0;

    while (currentRow !== toRow || currentCol !== toCol) {
      if (!this.board.isEmpty(currentRow, currentCol)) {
        screenCount++;
      }
      currentRow += rowDirection;
      currentCol += colDirection;
    }

    return screenCount;
  }

  private isValidElephantMove(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): boolean {
    // 檢查是否為 2 步斜對角移動
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    if (Math.abs(rowDiff) !== 2 || Math.abs(colDiff) !== 2) {
      return false;
    }

    // 取得當前棋子
    const piece = this.board.getPiece(fromRow, fromCol);
    if (!piece) {
      return false;
    }
    const isRed = piece.includes('Red');

    // 檢查是否在己方陣地（不能跨越河界）
    if (isRed) {
      // 紅方象：在紅方陣地 (1-5行)
      if (!this.isInRedSide(fromRow) || !this.isInRedSide(toRow)) {
        return false;
      }
    } else {
      // 黑方象：在黑方陣地 (6-10行)
      if (!this.isInBlackSide(fromRow) || !this.isInBlackSide(toRow)) {
        return false;
      }
    }

    // 檢查中間位置是否有棋子阻擋（塞象眼）
    const midRow = fromRow + rowDiff / 2;
    const midCol = fromCol + colDiff / 2;

    return this.board.isEmpty(midRow, midCol);
  }

  private isInRedSide(row: number): boolean {
    // 紅方陣地：1-5 行
    return row >= 1 && row <= 5;
  }

  private isInBlackSide(row: number): boolean {
    // 黑方陣地：6-10 行
    return row >= 6 && row <= 10;
  }

  private isValidSoldierMove(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): boolean {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    // 檢查是否只移動一格
    if (Math.abs(rowDiff) + Math.abs(colDiff) !== 1) {
      return false;
    }

    // 取得當前棋子
    const piece = this.board.getPiece(fromRow, fromCol);
    if (!piece) {
      return false;
    }
    const isRed = piece.includes('Red');

    // 檢查是否為合法的移動方向
    if (isRed) {
      // 紅方兵
      if (this.isRedSoldierCrossedRiver(fromRow)) {
        // 已過河：可以向前或左右移動，但不能後退
        return rowDiff >= 0; // 不能向後退（rowDiff < 0）
      } else {
        // 未過河：只能向前移動
        return rowDiff === 1 && colDiff === 0;
      }
    } else {
      // 黑方卒
      if (this.isBlackSoldierCrossedRiver(fromRow)) {
        // 已過河：可以向前或左右移動，但不能後退
        return rowDiff <= 0; // 不能向後退（rowDiff > 0）
      } else {
        // 未過河：只能向前移動
        return rowDiff === -1 && colDiff === 0;
      }
    }
  }

  private isRedSoldierCrossedRiver(row: number): boolean {
    // 紅方兵過河：在第 6 行及以上
    return row >= 6;
  }

  private isBlackSoldierCrossedRiver(row: number): boolean {
    // 黑方卒過河：在第 5 行及以下
    return row <= 5;
  }

  private checkGameEnd(): void {
    // 待實作
  }

  getBoard(): ChessBoard {
    return this.board;
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  getWinner(): string | undefined {
    return this.winner;
  }
}
