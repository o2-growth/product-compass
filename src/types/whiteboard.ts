export type Tool = "hand" | "select" | "pen" | "text" | "sticky";

export interface BaseItem {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface TextItem extends BaseItem {
  type: "text";
  text: string;
  w: number;
  h: number;
  color: string;
  fontSize: number;
}

export interface StickyItem extends BaseItem {
  type: "sticky";
  text: string;
  w: number;
  h: number;
  color: string;
}

export interface ProductItem extends BaseItem {
  type: "product";
  product_id: string;
  w: number;
  h: number;
}

export interface StrokeItem extends BaseItem {
  type: "stroke";
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export type WhiteboardItem = TextItem | StickyItem | ProductItem | StrokeItem;

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface WhiteboardState {
  items: WhiteboardItem[];
  viewport: Viewport;
}

export const DEFAULT_STATE: WhiteboardState = {
  items: [],
  viewport: { x: 0, y: 0, scale: 1 },
};

export const STICKY_COLORS = ["#FEF3A0", "#A8E66C", "#9FD2FF", "#FFB3BA", "#E0BBE4"];
