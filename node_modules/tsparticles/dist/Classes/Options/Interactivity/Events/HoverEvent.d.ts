import type { IHoverEvent } from "../../../../Interfaces/Options/Interactivity/Events/IHoverEvent";
import { HoverMode } from "../../../../Enums/Modes/HoverMode";
import { Parallax } from "./Parallax";
import type { RecursivePartial } from "../../../../Types/RecursivePartial";
export declare class HoverEvent implements IHoverEvent {
    enable: boolean;
    mode: HoverMode | HoverMode[];
    parallax: Parallax;
    constructor();
    load(data?: RecursivePartial<IHoverEvent>): void;
}
