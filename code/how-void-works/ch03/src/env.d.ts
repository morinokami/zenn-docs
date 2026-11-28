declare module "virtual:build-info" {
  const buildInfo: { environment: string; generatedAt: string };
  export default buildInfo;
}
