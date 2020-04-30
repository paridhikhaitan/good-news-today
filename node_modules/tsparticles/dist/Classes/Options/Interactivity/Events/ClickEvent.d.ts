import type { IClickEvent } from "../../../../Interfaces/Options/Interactivity/Events/IClickEvent";
import { ClickMode } from "../../../../Enums/Modes/ClickMode";
import type { RecursivePartial } from "../../../../Types/RecursivePartial";
export declare class ClickEvent implements IClickEvent {
    enable: boolean;
    mode: ClickMode | ClickMode[];
    constructor();
    load(data?: RecursivePartial<IClickEvent>): void;
}
