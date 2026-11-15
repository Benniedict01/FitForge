export type SamplePosition = {
  id: string;
  title: string;
  description: string;
  fen: string;
  tag: string;
};

export const SAMPLE_POSITIONS: SamplePosition[] = [
  {
    id: "opening",
    title: "Starting position",
    description: "A clean baseline to verify the engine and move notation.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    tag: "OPENING",
  },
  {
    id: "mate-in-one",
    title: "Mate in one",
    description: "White has a forced finish. Stockfish should find it immediately.",
    fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    tag: "TACTICS",
  },
  {
    id: "endgame",
    title: "Pawn endgame",
    description: "A sparse king-and-pawn position; check whose turn it is.",
    fen: "8/8/8/8/8/5k2/6p1/4K3 w - - 0 1",
    tag: "ENDGAME",
  },
];

export const START_FEN = SAMPLE_POSITIONS[0].fen;
