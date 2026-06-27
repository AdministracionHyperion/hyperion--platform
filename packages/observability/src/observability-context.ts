export interface ObservabilityContext {
  readonly correlationId: string;
  readonly tenantId?: string;
  readonly actorId?: string;
  readonly route?: string;
  readonly method?: string;
}
