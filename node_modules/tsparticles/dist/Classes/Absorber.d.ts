import type { ICoordinates } from "../Interfaces/ICoordinates";
import type { Container } from "./Container";
import type { Particle } from "./Particle";
import { IRgb } from "../Interfaces/IRgb";
import { IAbsorber } from "../Interfaces/Options/Absorbers/IAbsorber";
export declare class Absorber {
    color: IRgb;
    limit?: number;
    mass: number;
    opacity: number;
    position: ICoordinates;
    size: number;
    private readonly container;
    private readonly initialPosition?;
    private readonly options;
    constructor(container: Container, options: IAbsorber, position?: ICoordinates);
    attract(particle: Particle): boolean;
    resize(): void;
    draw(): void;
    private calcPosition;
}
