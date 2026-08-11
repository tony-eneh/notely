import { db } from "@/lib/db";

/**
 * Makes sure the signed-in Clerk user has a row, for the window before the
 * user.created webhook lands (or when no webhook is configured at all).
 *
 * The placeholder email is derived from the user id on purpose: User.email is
 * unique, so a shared literal like "" lets the first user through and then
 * fails every later one with a unique-constraint violation. The webhook
 * overwrites it with the real address once it arrives.
 */
export async function ensureUser(userId: string) {
  return db.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: `${userId}@pending.notely.local`,
    },
    update: {},
  });
}
