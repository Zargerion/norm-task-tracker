import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

async function main() {
  const login = requireEnv('SEED_SUPER_ADMIN_LOGIN');
  const password = requireEnv('SEED_SUPER_ADMIN_PASSWORD');
  const telegramId = requireEnv('SEED_SUPER_ADMIN_TELEGRAM_ID');
  const firstName = process.env.SEED_SUPER_ADMIN_FIRST_NAME?.trim() || 'Super';
  const lastName = process.env.SEED_SUPER_ADMIN_LAST_NAME?.trim() || 'Admin';

  const passwordHash = await argon2.hash(password);

  const superAdmin = await prisma.user.upsert({
    where: { login },
    update: {},
    create: {
      firstName,
      lastName,
      login,
      passwordHash,
      telegramId,
      isSuperAdmin: true,
      isApproved: true,
    },
  });

  console.log('Super admin created:', superAdmin.login);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
