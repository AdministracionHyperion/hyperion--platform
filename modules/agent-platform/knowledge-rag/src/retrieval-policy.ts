export interface RetrievalPolicy {
  readonly topK: number;
  readonly minScore: number;
  readonly allowCrossTenant: false;
  readonly citeSources: boolean;
}

export const defaultRetrievalPolicy: RetrievalPolicy = {
  topK: 5,
  minScore: 0.7,
  allowCrossTenant: false,
  citeSources: true,
};
