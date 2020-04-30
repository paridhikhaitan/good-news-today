import { Particle } from "../../Particle";
import { Container } from "../../Container";
export declare class Collider {
    static collide(p1: Particle, container: Container): void;
    private static getRadius;
    private static resolveCollision;
    private static rotate;
}
