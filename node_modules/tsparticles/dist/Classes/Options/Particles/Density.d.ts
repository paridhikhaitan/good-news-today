import type { IDensity } from "../../../Interfaces/Options/Particles/IDensity";
import type { RecursivePartial } from "../../../Types/RecursivePartial";
export declare class Density implements IDensity {
    get value_area(): number;
    set value_area(value: number);
    enable: boolean;
    area: number;
    constructor();
    load(data?: RecursivePartial<IDensity>): void;
}
