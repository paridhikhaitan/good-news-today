import type { IOptionLoader } from "../IOptionLoader";
import type { IColor } from "../../IColor";
export interface IBackgroundMaskCover extends IOptionLoader<IBackgroundMaskCover> {
    color: IColor | string;
    opacity: number;
}
