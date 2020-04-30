import type { IPolygonInline } from "../../../Interfaces/Options/PolygonMask/IPolygonInline";
import { PolygonMaskInlineArrangement } from "../../../Enums/PolygonMaskInlineArrangement";
import type { RecursivePartial } from "../../../Types/RecursivePartial";
export declare class PolygonInline implements IPolygonInline {
    arrangement: PolygonMaskInlineArrangement;
    constructor();
    load(data?: RecursivePartial<IPolygonInline>): void;
}
