import type { IOptionLoader } from "../IOptionLoader";
export interface IDensity extends IOptionLoader<IDensity> {
    enable: boolean;
    value_area: number;
    area: number;
}
