import type { IDimension } from "../../Interfaces/IDimension";
import type { ICoordinates } from "../../Interfaces/ICoordinates";
import type { IRgb } from "../../Interfaces/IRgb";
import type { ILineLinkedShadow } from "../../Interfaces/Options/Particles/LineLinked/ILineLinkedShadow";
import type { IPolygonMaskDrawStroke } from "../../Interfaces/Options/PolygonMask/IPolygonMaskDrawStroke";
import type { IParticle } from "../../Interfaces/IParticle";
import type { IShadow } from "../../Interfaces/Options/Particles/IShadow";
import type { IShapeDrawer } from "../../Interfaces/IShapeDrawer";
import { Absorber } from "../Absorber";
export declare class CanvasUtils {
    private static readonly drawers;
    static paintBase(context: CanvasRenderingContext2D, dimension: IDimension, baseColor?: string): void;
    static clear(context: CanvasRenderingContext2D, dimension: IDimension): void;
    static drawPolygonMask(context: CanvasRenderingContext2D, rawData: ICoordinates[], stroke: IPolygonMaskDrawStroke): void;
    static drawPolygonMaskPath(context: CanvasRenderingContext2D, path: Path2D, stroke: IPolygonMaskDrawStroke, position: ICoordinates): void;
    static drawAbsorber(context: CanvasRenderingContext2D, absorber: Absorber): void;
    static drawLineLinked(context: CanvasRenderingContext2D, width: number, begin: ICoordinates, end: ICoordinates, backgroundMask: boolean, colorLine: IRgb, opacity: number, shadow: ILineLinkedShadow): void;
    static drawConnectLine(context: CanvasRenderingContext2D, width: number, lineStyle: CanvasGradient, begin: ICoordinates, end: ICoordinates): void;
    static gradient(context: CanvasRenderingContext2D, p1: IParticle, p2: IParticle, opacity: number): CanvasGradient | undefined;
    static drawGrabLine(context: CanvasRenderingContext2D, width: number, begin: ICoordinates, end: ICoordinates, colorLine: IRgb, opacity: number): void;
    static drawParticle(context: CanvasRenderingContext2D, particle: IParticle, colorValue: string, backgroundMask: boolean, radius: number, opacity: number, shadow: IShadow): void;
    static addShapeDrawer(type: string, drawer: IShapeDrawer): void;
    static drawShape(context: CanvasRenderingContext2D, particle: IParticle, radius: number, opacity: number): void;
}
