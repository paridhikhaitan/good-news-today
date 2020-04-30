import type { IDivEvent } from "../../../../Interfaces/Options/Interactivity/Events/IDivEvent";
import { DivMode } from "../../../../Enums/Modes/DivMode";
import type { RecursivePartial } from "../../../../Types/RecursivePartial";
export declare class DivEvent implements IDivEvent {
    get el(): string;
    set el(value: string);
    elementId: string;
    enable: boolean;
    mode: DivMode | DivMode[];
    constructor();
    load(data?: RecursivePartial<IDivEvent>): void;
}
