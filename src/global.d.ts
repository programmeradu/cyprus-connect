declare module "*.css";

interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
}
declare module "*.jpg" { const c: StaticImageData; export default c; }
declare module "*.jpeg" { const c: StaticImageData; export default c; }
declare module "*.png" { const c: StaticImageData; export default c; }
declare module "*.webp" { const c: StaticImageData; export default c; }
declare module "*.svg" { const c: StaticImageData; export default c; }
