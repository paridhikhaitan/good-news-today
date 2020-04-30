import type { IOptionsColor } from "../../../Interfaces/Options/Particles/IOptionsColor";
import type { IValueColor } from "../../../Interfaces/IValueColor";
import type { RecursivePartial } from "../../../Types/RecursivePartial";
import type { IRgb } from "../../../Interfaces/IRgb";
import type { IHsl } from "../../../Interfaces/IHsl";
export declare class OptionsColor implements IOptionsColor {
    value: string | IValueColor | IRgb | IHsl | string[];
    constructor();
    load(data?: RecursivePartial<IOptionsColor>): void;
    static create(source?: OptionsColor, data?: string | RecursivePartial<IOptionsColor>): OptionsColor;
}
