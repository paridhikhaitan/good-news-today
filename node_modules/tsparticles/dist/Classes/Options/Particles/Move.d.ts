import type { IMove } from "../../../Interfaces/Options/Particles/IMove";
import { Attract } from "./Attract";
import { MoveDirection } from "../../../Enums/MoveDirection";
import { OutMode } from "../../../Enums/OutMode";
import { Trail } from "./Trail";
import type { RecursivePartial } from "../../../Types/RecursivePartial";
export declare class Move implements IMove {
    get collisions(): boolean;
    set collisions(value: boolean);
    get bounce(): boolean;
    set bounce(value: boolean);
    get out_mode(): OutMode;
    set out_mode(value: OutMode);
    attract: Attract;
    direction: MoveDirection;
    enable: boolean;
    outMode: OutMode;
    random: boolean;
    speed: number;
    straight: boolean;
    trail: Trail;
    constructor();
    load(data?: RecursivePartial<IMove>): void;
}
