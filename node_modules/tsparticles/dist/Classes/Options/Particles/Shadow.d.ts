import type { IShadow } from "../../../Interfaces/Options/Particles/IShadow";
import type { ICoordinates } from "../../../Interfaces/ICoordinates";
import type { RecursivePartial } from "../../../Types/RecursivePartial";
import { OptionsColor } from "./OptionsColor";
export declare class Shadow implements IShadow {
    blur: number;
    color: OptionsColor;
    enable: boolean;
    offset: ICoordinates;
    constructor();
    load(data?: RecursivePartial<IShadow>): void;
}
