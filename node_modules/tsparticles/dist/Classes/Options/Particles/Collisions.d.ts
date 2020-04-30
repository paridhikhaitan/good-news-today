import type { ICollisions } from "../../../Interfaces/Options/Particles/ICollisions";
import { CollisionMode } from "../../../Enums/CollisionMode";
import type { RecursivePartial } from "../../../Types/RecursivePartial";
export declare class Collisions implements ICollisions {
    enable: boolean;
    mode: CollisionMode;
    constructor();
    load(data?: RecursivePartial<ICollisions>): void;
}
