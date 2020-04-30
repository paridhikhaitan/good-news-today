import type { IAttract } from "../../../Interfaces/Options/Particles/IAttract";
import type { ICoordinates } from "../../../Interfaces/ICoordinates";
import type { RecursivePartial } from "../../../Types/RecursivePartial";
export declare class Attract implements IAttract {
    get rotateX(): number;
    set rotateX(value: number);
    get rotateY(): number;
    set rotateY(value: number);
    enable: boolean;
    rotate: ICoordinates;
    constructor();
    load(data?: RecursivePartial<IAttract>): void;
}
