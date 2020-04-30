import { Container } from "./Container";
import type { ICoordinates } from "../Interfaces/ICoordinates";
import type { IDimension } from "../Interfaces/IDimension";
import { ISvgPath } from "../Interfaces/ISvgPath";
export declare class PolygonMask {
    redrawTimeout?: number;
    raw?: ICoordinates[];
    svg?: SVGSVGElement;
    paths: ISvgPath[];
    dimension: IDimension;
    offset?: ICoordinates;
    readonly path2DSupported: boolean;
    private readonly container;
    constructor(container: Container);
    checkInsidePolygon(position: ICoordinates | undefined): boolean;
    redraw(): void;
    init(): Promise<void>;
    reset(): void;
    randomPointInPolygon(): ICoordinates;
    parseSvgPathToPolygon(svgUrl?: string): Promise<ICoordinates[] | undefined>;
    drawPolygon(): void;
    drawPointsOnPolygonPath(): void;
    private getRandomPointOnPolygonPath;
    private getRandomPointOnPolygonPathByLength;
    private getEquidistantPointOnPolygonPathByIndex;
    private getPointOnPolygonPathByIndex;
    private createPath2D;
}
