import { strict as assert } from "node:assert";
import { decideInvite } from "./invite_onboarding.ts";

assert.equal(decideInvite({ inviteCode: "open-sesame", email: "a@b.test", password: "secret", name: "A" }, "open-sesame"), true);
assert.equal(decideInvite({ inviteCode: "wrong", email: "a@b.test", password: "secret", name: "A" }, "open-sesame"), false);
console.log("invite decision test passed");
