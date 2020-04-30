import type { IOptionLoader } from "../IOptionLoader";
import type { IPolygonMaskDrawStroke } from "./IPolygonMaskDrawStroke";
import type { IColor } from "../../IColor";
export interface IPolygonMaskDraw extends IOptionLoader<IPolygonMaskDraw> {
    enable: boolean;
    lineColor: string | IColor;
    lineWidth: number;
    stroke: IPolygonMaskDrawStroke;
}
