export class ChessBoard {
  private pieces: { [key: string]: string } = {};

  placePiece(piece: string, row: number, col: number): void {
    const key = `${row},${col}`;
    this.pieces[key] = piece;
  }

  getPiece(row: number, col: number): string | undefined {
    const key = `${row},${col}`;
    return this.pieces[key];
  }

  removePiece(row: number, col: number): void {
    const key = `${row},${col}`;
    delete this.pieces[key];
  }

  isEmpty(row: number, col: number): boolean {
    const key = `${row},${col}`;
    return !this.pieces[key];
  }

  clear(): void {
    this.pieces = {};
  }
}
