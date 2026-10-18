export type BackgroundConfig = {
  active: boolean;
  color: string;
};

export type GradientConfig = {
  from: string;
  to: string;
  frequency: number;
  octaves: number;
  seed: number;
  type: "turbulence" | "fractalNoise";
  bands: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  color: string;
  strength: number;
  sides: boolean;
};

export type ShadowConfig = {
  active: boolean;
  color: string;
  opacity: number;
  dx: number;
  dy: number;
  mode: "street" | "soft";
};

export type EdgeConfig = {
  active: boolean;
  color: string;
  opacity: number;
  width: number;
};

export type OutlineConfig = {
  triangleColor: string;
  triangleWidth: number;
  streetColor: string;
  streetWidth: number;
  joinStyle: "round" | "bevel" | "miter";
};

export type CDSLogoConfig = {
  canvas: BackgroundConfig;
  triangle: GradientConfig;
  street: GradientConfig;
  shadow: ShadowConfig;
  edge: EdgeConfig;
  outline: OutlineConfig;
};
