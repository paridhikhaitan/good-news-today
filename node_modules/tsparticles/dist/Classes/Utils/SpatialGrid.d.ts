import type { ICoordinates } from "../../Interfaces/ICoordinates";
import type { IDimension } from "../../Interfaces/IDimension";
import type { Particle } from "../Particle";
export declare class SpatialGrid {
    private readonly cellSize;
    private widthSegment;
    private heightSegment;
    private grid;
    constructor(canvas: IDimension);
    setGrid(particles: Particle[], dimension?: IDimension): void;
    queryInCell(position: ICoordinates): Particle[];
    queryRadius(position: ICoordinates, radius: number): Particle[];
    queryRadiusWithDistance(position: ICoordinates, radius: number): {
        distance: number;
        particle: Particle;
    }[];
    private select;
    private index;
    private radius;
    private indexOp;
    private clamp;
}
