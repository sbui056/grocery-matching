export interface Match {
  idA: number;
  idB: number;
  nameA: string;
  nameB: string;
  brandA: string;
  brandB: string;
  sizeA: string;
  sizeB: string;
  composite: number;
  tfidf: number;
  embedding: number;
  brand: number;
  size: number;
  jaccard: number;
  confidence: "high" | "medium" | "low";
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface BrandPair {
  brandA: string;
  brandB: string;
  count: number;
}

export interface Summary {
  totalMatches: number;
  storeAProducts: number;
  storeBProducts: number;
  candidatePairsReduced: string;
  pipelineRuntime: string;
  confidence: {
    high: number;
    medium: number;
    low: number;
  };
  scoreStats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    p25: number;
    p75: number;
  };
  signalAverages: Record<string, number>;
  scoreDistribution: ScoreDistribution[];
  topBrandPairs: BrandPair[];
  privateLabelMatches: number;
}
