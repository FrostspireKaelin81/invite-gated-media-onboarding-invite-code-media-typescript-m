import { createOnboardingResult, decideInvite, type InviteRequest } from "./invite_onboarding.ts";
import { InfraiClient, infrai } from "./infrai_client.ts";

const request: InviteRequest = {
  inviteCode: process.env.INVITE_CODE_INPUT ?? "",
  email: process.env.ONBOARDING_EMAIL ?? "",
  password: process.env.ONBOARDING_PASSWORD ?? "",
  name: process.env.ONBOARDING_NAME ?? "creator",
};
const expectedCode = process.env.INVITE_CODE ?? "media-community";

async function main(): Promise<void> {
  if (!decideInvite(request, expectedCode)) {
    console.log(JSON.stringify({ accepted: false, reason: "invite_required" }));
    return;
  }
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const client = new InfraiClient(key);
  const user = await client.createUser({
    email: request.email,
    password: request.password,
    name: request.name,
    metadata: { onboarding: "media-community" },
    vendor: "in-house",
    mode: "default_vendor",
    idempotency_key: `invite-onboarding:${request.email}`,
  });
  const result = createOnboardingResult(request, user.id);
  console.log(JSON.stringify({ capability: infrai.auth.user.create, accepted: result.accepted, userId: result.userId, asset: result.asset }));
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
