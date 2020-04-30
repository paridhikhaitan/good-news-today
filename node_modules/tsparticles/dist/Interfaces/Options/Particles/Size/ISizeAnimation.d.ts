import type { IOptionLoader } from "../../IOptionLoader";
export interface ISizeAnimation extends IOptionLoader<ISizeAnimation> {
    enable: boolean;
    size_min: number;
    minimumValue: number;
    speed: number;
    sync: boolean;
}
