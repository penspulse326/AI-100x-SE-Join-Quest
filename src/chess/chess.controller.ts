import {
  Controller,
  Get,
  Post,
  Body,
  Render,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ChessService } from './chess.service';
import { ChessGame } from './chess-game';
import { ChessBoard } from './chess-board';

interface GameSession {
  gameId: string;
  game: ChessGame;
  currentPlayer: string;
}

interface MoveRequest {
  gameId: string;
  piece: string;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

interface ResetRequest {
  gameId: string;
}

@Controller('chess')
export class ChessController {
  private gameSessions: Map<string, GameSession> = new Map();

  constructor(private readonly chessService: ChessService) {}

  @Get()
  @Render('chess')
  showChessGame() {
    return { title: '中國象棋 Chinese Chess' };
  }

  @Post('new-game')
  createNewGame() {
    try {
      const gameId = this.generateGameId();
      const board = new ChessBoard();
      const game = new ChessGame(board);

      // 初始化標準象棋開局
      this.setupInitialBoard(board);

      const gameSession: GameSession = {
        gameId,
        game,
        currentPlayer: 'Red',
      };

      this.gameSessions.set(gameId, gameSession);

      return {
        success: true,
        gameId,
        board: this.serializeBoard(board),
        currentPlayer: 'Red',
      };
    } catch (_error) {
      throw new HttpException(
        '創建新遊戲失敗',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('move')
  makeMove(@Body() moveRequest: MoveRequest) {
    try {
      const { gameId, piece, fromRow, fromCol, toRow, toCol } = moveRequest;

      const gameSession = this.gameSessions.get(gameId);
      if (!gameSession) {
        throw new HttpException('遊戲會話不存在', HttpStatus.NOT_FOUND);
      }

      // 檢查是否輪到該玩家
      const pieceColor = piece.split(' ')[0];
      if (pieceColor !== gameSession.currentPlayer) {
        return {
          success: false,
          message: `現在是 ${gameSession.currentPlayer} 的回合`,
        };
      }

      // 嘗試移動
      const result = gameSession.game.makeMove(
        piece,
        fromRow,
        fromCol,
        toRow,
        toCol,
      );

      if (result.legal) {
        // 更新當前玩家
        if (!result.gameOver) {
          gameSession.currentPlayer =
            gameSession.currentPlayer === 'Red' ? 'Black' : 'Red';
        }

        return {
          success: true,
          board: this.serializeBoard(gameSession.game.getBoard()),
          gameOver: result.gameOver,
          winner: result.winner,
          currentPlayer: gameSession.currentPlayer,
        };
      } else {
        return {
          success: false,
          message: '不合法的移動',
        };
      }
    } catch (_error) {
      throw new HttpException('移動處理失敗', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('reset')
  resetGame(@Body() resetRequest: ResetRequest) {
    try {
      const { gameId } = resetRequest;

      const gameSession = this.gameSessions.get(gameId);
      if (!gameSession) {
        throw new HttpException('遊戲會話不存在', HttpStatus.NOT_FOUND);
      }

      // 重置棋盤
      const board = new ChessBoard();
      const game = new ChessGame(board);
      this.setupInitialBoard(board);

      gameSession.game = game;
      gameSession.currentPlayer = 'Red';

      return {
        success: true,
        board: this.serializeBoard(board),
        currentPlayer: 'Red',
      };
    } catch (_error) {
      throw new HttpException('重置遊戲失敗', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private generateGameId(): string {
    return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private setupInitialBoard(board: ChessBoard): void {
    // 黑方棋子 (頂部, 第8-10行)
    board.placePiece('Black Rook', 10, 1);
    board.placePiece('Black Horse', 10, 2);
    board.placePiece('Black Elephant', 10, 3);
    board.placePiece('Black Guard', 10, 4);
    board.placePiece('Black General', 10, 5);
    board.placePiece('Black Guard', 10, 6);
    board.placePiece('Black Elephant', 10, 7);
    board.placePiece('Black Horse', 10, 8);
    board.placePiece('Black Rook', 10, 9);

    board.placePiece('Black Cannon', 8, 2);
    board.placePiece('Black Cannon', 8, 8);

    board.placePiece('Black Soldier', 7, 1);
    board.placePiece('Black Soldier', 7, 3);
    board.placePiece('Black Soldier', 7, 5);
    board.placePiece('Black Soldier', 7, 7);
    board.placePiece('Black Soldier', 7, 9);

    // 紅方棋子 (底部, 第1-3行)
    board.placePiece('Red Rook', 1, 1);
    board.placePiece('Red Horse', 1, 2);
    board.placePiece('Red Elephant', 1, 3);
    board.placePiece('Red Guard', 1, 4);
    board.placePiece('Red General', 1, 5);
    board.placePiece('Red Guard', 1, 6);
    board.placePiece('Red Elephant', 1, 7);
    board.placePiece('Red Horse', 1, 8);
    board.placePiece('Red Rook', 1, 9);

    board.placePiece('Red Cannon', 3, 2);
    board.placePiece('Red Cannon', 3, 8);

    board.placePiece('Red Soldier', 4, 1);
    board.placePiece('Red Soldier', 4, 3);
    board.placePiece('Red Soldier', 4, 5);
    board.placePiece('Red Soldier', 4, 7);
    board.placePiece('Red Soldier', 4, 9);
  }

  private serializeBoard(board: ChessBoard): { [key: string]: string } {
    const serialized: { [key: string]: string } = {};

    for (let row = 1; row <= 10; row++) {
      for (let col = 1; col <= 9; col++) {
        const piece = board.getPiece(row, col);
        if (piece) {
          serialized[`${row},${col}`] = piece;
        }
      }
    }

    return serialized;
  }
}
