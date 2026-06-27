import type { CalleeAlias } from "./callee-alias";
import type { RuntimeContactTarget } from "./outbound-call-launch-request";

export interface ContactResolverPort {
  resolveCalleeAlias(calleeAlias: CalleeAlias, tenantId: string): Promise<RuntimeContactTarget>;
}
