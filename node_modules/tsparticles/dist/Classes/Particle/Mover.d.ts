import type { Container } from "../Container";
import type { IParticle } from "../../Interfaces/IParticle";
export declare class Mover {
    private readonly container;
    private readonly particle;
    constructor(container: Container, particle: IParticle);
    move(delta: number): void;
    private moveParallax;
    private getProximitySpeedFactor;
}
