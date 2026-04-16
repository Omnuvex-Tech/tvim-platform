export const config = {
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    name: process.env.NEXT_PUBLIC_APP_NAME ?? "Tvim",
  },
  api: {
    url: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
    timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 30000),
  },
} as const;
