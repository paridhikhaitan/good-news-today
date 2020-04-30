import type { DivMode } from "../../../../Enums/Modes/DivMode";
import type { IOptionLoader } from "../../IOptionLoader";
export interface IDivEvent extends IOptionLoader<IDivEvent> {
    enable: boolean;
    mode: DivMode | DivMode[];
    el: string;
    elementId: string;
}
