export interface EmbeddingProviderPort {
  embedText(tenantId: string, text: string): Promise<readonly number[]>;
}
