import type { IGrabLineLinked } from "../../../../Interfaces/Options/Interactivity/Modes/IGrabLineLinked";
import type { RecursivePartial } from "../../../../Types/RecursivePartial";
export declare class GrabLineLinked implements IGrabLineLinked {
    opacity: number;
    constructor();
    load(data?: RecursivePartial<IGrabLineLinked>): void;
}
