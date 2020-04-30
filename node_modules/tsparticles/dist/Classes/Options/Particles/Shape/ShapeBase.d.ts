import type { RecursivePartial } from "../../../../Types/RecursivePartial";
import type { IShapeValues } from "../../../../Interfaces/Options/Particles/Shape/IShapeValues";
import { IParticles } from "../../../../Interfaces/Options/Particles/IParticles";
export declare class ShapeBase implements IShapeValues {
    close?: boolean;
    fill?: boolean;
    particles?: RecursivePartial<IParticles>;
    constructor();
    load(data?: RecursivePartial<IShapeValues>): void;
}
