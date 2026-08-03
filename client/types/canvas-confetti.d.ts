declare module "canvas-confetti" {
  interface Shape {}
  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    flat?: boolean;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: (string | Shape)[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }
  interface ConfettiFn {
    (options?: Options): Promise<null>;
    shapeFromText(opts: { text: string; scalar?: number }): Shape;
  }
  const confetti: ConfettiFn;
  export default confetti;
}
