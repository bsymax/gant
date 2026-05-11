/** 种子脚本给用户的初始登录密码（可被环境变量覆盖） */
export function getSeedDefaultPassword(): string {
  const fromEnv = process.env.SEED_DEFAULT_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  return "11111111";
}
