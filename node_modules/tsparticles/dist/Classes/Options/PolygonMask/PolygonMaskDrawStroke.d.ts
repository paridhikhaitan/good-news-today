import type { IPolygonMaskDrawStroke } from "../../../Interfaces/Options/PolygonMask/IPolygonMaskDrawStroke";
import type { RecursivePartial } from "../../../Types/RecursivePartial";
import { OptionsColor } from "../Particles/OptionsColor";
export declare class PolygonMaskDrawStroke implements IPolygonMaskDrawStroke {
    color: OptionsColor;
    width: number;
    opacity: number;
    constructor();
    load(data?: RecursivePartial<IPolygonMaskDrawStroke>): void;
}
