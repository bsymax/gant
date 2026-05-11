import bcrypt from "bcryptjs";

const ROUNDS = 10;

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

export const PASSWORD_MIN_LENGTH = 8;

export function assertPasswordPolicy(plain: string): void {
  if (plain.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`密码至少 ${PASSWORD_MIN_LENGTH} 位`);
  }
}
