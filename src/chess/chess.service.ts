import { Injectable } from '@nestjs/common';
import { ChessBoard } from './chess-board';
import { ChessGame } from './chess-game';

@Injectable()
export class ChessService {
  createGame(): ChessGame {
    const board = new ChessBoard();
    return new ChessGame(board);
  }

  createBoard(): ChessBoard {
    return new ChessBoard();
  }
}
