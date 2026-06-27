import type { CalleeAlias } from "../../../../modules/voice/telephony/src/callee-alias";
import type { ContactResolverPort } from "../../../../modules/voice/telephony/src/contact-resolver.port";
import type { RuntimeContactTarget } from "../../../../modules/voice/telephony/src/outbound-call-launch-request";

export class FakeContactResolver implements ContactResolverPort {
  async resolveCalleeAlias(
    _calleeAlias: CalleeAlias,
    _tenantId: string,
  ): Promise<RuntimeContactTarget> {
    return {
      e164Number: "+570000000000",
      nonPersistable: true,
    };
  }
}
