declare module "*.css";
declare module "*.css?url" {
  const href: string;
  export default href;
}
declare module "*.jpg?url" { const src: string; export default src; }
declare module "*.jpeg?url" { const src: string; export default src; }
declare module "*.png?url" { const src: string; export default src; }
declare module "*.webp?url" { const src: string; export default src; }
declare module "*.svg?url" { const src: string; export default src; }
