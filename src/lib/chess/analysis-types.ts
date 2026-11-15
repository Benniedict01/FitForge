export type EngineLine = {
  rank: number;
  move: string;
  uci: string;
  piece: string;
  from: string;
  to: string;
  evaluation: string;
  score: { type: "cp" | "mate"; value: number };
  depth: number;
  principalVariation: string[];
  pvUci: string[];
};

export type AnalysisResult = {
  success: true;
  status: "analyzed";
  fen: string;
  bestMove: string;
  uci: string;
  piece: string;
  from: string;
  to: string;
  evaluation: string;
  score: { type: "cp" | "mate"; value: number };
  explanation: string;
  principalVariation: string[];
  pvUci: string[];
  alternatives: EngineLine[];
  depth: number;
  engine: string;
  analyzedAt: string;
};
