import { resolveAuthSecrets } from './src/application/auth/agronautas-auth-service';
import { getAgronautasRuntimeConfig } from './src/infrastructure/config/agronautas-runtime';
import { PostgresAgronautasAuthRepository } from './src/infrastructure/database/postgres/agronautas-auth-repository';
import { RedisAgronautasAuthDenyStore } from './src/infrastructure/database/redis/agronautas-auth-deny-store';
import { config } from 'dotenv';
config();

try {
  const runtimeConfig = getAgronautasRuntimeConfig()
  console.log("Config OK");
  const secrets = resolveAuthSecrets();
  console.log("Secrets OK");
  const redis = new RedisAgronautasAuthDenyStore();
  console.log("Redis Store OK");
  const repo = new PostgresAgronautasAuthRepository();
  console.log("Repo OK");
} catch (e) {
  console.error("ERROR:", e);
}
