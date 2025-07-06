import { Given, When, Then } from '@cucumber/cucumber';
import { ChessBoard } from '../../src/chess/chess-board';
import { ChessGame } from '../../src/chess/chess-game';

let board: ChessBoard;
let game: ChessGame;
let moveResult: { legal: boolean; winner?: string; gameOver?: boolean };

// Given steps
Given(
  'the board is empty except for a Red General at \\({int}, {int})',
  function (row: number, col: number) {
    board = new ChessBoard();
    game = new ChessGame(board);
    board.placePiece('Red General', row, col);
  },
);

Given(
  'the board is empty except for a Red Guard at \\({int}, {int})',
  function (row: number, col: number) {
    board = new ChessBoard();
    game = new ChessGame(board);
    board.placePiece('Red Guard', row, col);
  },
);

Given(
  'the board is empty except for a Red Rook at \\({int}, {int})',
  function (row: number, col: number) {
    board = new ChessBoard();
    game = new ChessGame(board);
    board.placePiece('Red Rook', row, col);
  },
);

Given(
  'the board is empty except for a Red Horse at \\({int}, {int})',
  function (row: number, col: number) {
    board = new ChessBoard();
    game = new ChessGame(board);
    board.placePiece('Red Horse', row, col);
  },
);

Given(
  'the board is empty except for a Red Cannon at \\({int}, {int})',
  function (row: number, col: number) {
    board = new ChessBoard();
    game = new ChessGame(board);
    board.placePiece('Red Cannon', row, col);
  },
);

Given(
  'the board is empty except for a Red Elephant at \\({int}, {int})',
  function (row: number, col: number) {
    board = new ChessBoard();
    game = new ChessGame(board);
    board.placePiece('Red Elephant', row, col);
  },
);

Given(
  'the board is empty except for a Red Soldier at \\({int}, {int})',
  function (row: number, col: number) {
    board = new ChessBoard();
    game = new ChessGame(board);
    board.placePiece('Red Soldier', row, col);
  },
);

Given('the board has:', function (dataTable: any) {
  board = new ChessBoard();
  game = new ChessGame(board);

  const rows = dataTable.hashes();
  for (const row of rows) {
    const piece = row.Piece;
    const position = row.Position;
    const [positionRow, positionCol] = position
      .replace('(', '')
      .replace(')', '')
      .split(', ')
      .map(Number);
    board.placePiece(piece, positionRow, positionCol);
  }
});

// When steps
When(
  'Red moves the General from \\({int}, {int}) to \\({int}, {int})',
  function (fromRow: number, fromCol: number, toRow: number, toCol: number) {
    moveResult = game.makeMove('Red General', fromRow, fromCol, toRow, toCol);
  },
);

When(
  'Red moves the Guard from \\({int}, {int}) to \\({int}, {int})',
  function (fromRow: number, fromCol: number, toRow: number, toCol: number) {
    moveResult = game.makeMove('Red Guard', fromRow, fromCol, toRow, toCol);
  },
);

When(
  'Red moves the Rook from \\({int}, {int}) to \\({int}, {int})',
  function (fromRow: number, fromCol: number, toRow: number, toCol: number) {
    moveResult = game.makeMove('Red Rook', fromRow, fromCol, toRow, toCol);
  },
);

When(
  'Red moves the Horse from \\({int}, {int}) to \\({int}, {int})',
  function (fromRow: number, fromCol: number, toRow: number, toCol: number) {
    moveResult = game.makeMove('Red Horse', fromRow, fromCol, toRow, toCol);
  },
);

When(
  'Red moves the Cannon from \\({int}, {int}) to \\({int}, {int})',
  function (fromRow: number, fromCol: number, toRow: number, toCol: number) {
    moveResult = game.makeMove('Red Cannon', fromRow, fromCol, toRow, toCol);
  },
);

When(
  'Red moves the Elephant from \\({int}, {int}) to \\({int}, {int})',
  function (fromRow: number, fromCol: number, toRow: number, toCol: number) {
    moveResult = game.makeMove('Red Elephant', fromRow, fromCol, toRow, toCol);
  },
);

When(
  'Red moves the Soldier from \\({int}, {int}) to \\({int}, {int})',
  function (fromRow: number, fromCol: number, toRow: number, toCol: number) {
    moveResult = game.makeMove('Red Soldier', fromRow, fromCol, toRow, toCol);
  },
);

// Then steps
Then('the move is legal', function () {
  if (!moveResult.legal) {
    throw new Error(`Expected move to be legal, but it was illegal`);
  }
});

Then('the move is illegal', function () {
  if (moveResult.legal) {
    throw new Error(`Expected move to be illegal, but it was legal`);
  }
});

Then('Red wins immediately', function () {
  if (!moveResult.legal) {
    throw new Error(`Expected move to be legal, but it was illegal`);
  }
  if (moveResult.winner !== 'Red') {
    throw new Error(
      `Expected Red to win, but winner was: ${moveResult.winner}`,
    );
  }
});

Then('the game is not over just from that capture', function () {
  if (!moveResult.legal) {
    throw new Error(`Expected move to be legal, but it was illegal`);
  }
  if (moveResult.gameOver) {
    throw new Error(`Expected game to continue, but it was over`);
  }
});
