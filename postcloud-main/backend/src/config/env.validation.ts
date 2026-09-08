const requiredEnvVars = [
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'S3_ENDPOINT',
  'S3_BACKEND_ACCESS_KEY',
  'S3_BACKEND_SECRET_KEY',
];

export function validateEnv(config: Record<string, unknown>) {
  const missingVars = requiredEnvVars.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missingVars.join(', ')}`,
    );
  }

  return config;
}
