export type InviteRequest = {
  inviteCode: string;
  email: string;
  password: string;
  name: string;
};

export type OnboardingResult = {
  accepted: boolean;
  userId?: string;
  asset: { name: string; state: "queued"; delivery: "creator" };
};

export function decideInvite(request: InviteRequest, expectedCode: string): boolean {
  return request.inviteCode.length > 0 && request.inviteCode === expectedCode;
}

export function createOnboardingResult(request: InviteRequest, userId: string): OnboardingResult {
  return {
    accepted: true,
    userId,
    asset: { name: `${request.name}-first-upload`, state: "queued", delivery: "creator" },
  };
}
