import type { IAttract } from "./IAttract";
import type { MoveDirection } from "../../../Enums/MoveDirection";
import type { OutMode } from "../../../Enums/OutMode";
import type { IOptionLoader } from "../IOptionLoader";
import type { ITrail } from "./ITrail";
export interface IMove extends IOptionLoader<IMove> {
    attract: IAttract;
    bounce: boolean;
    collisions: boolean;
    direction: MoveDirection;
    enable: boolean;
    out_mode: OutMode;
    outMode: OutMode;
    random: boolean;
    speed: number;
    straight: boolean;
    trail: ITrail;
}
