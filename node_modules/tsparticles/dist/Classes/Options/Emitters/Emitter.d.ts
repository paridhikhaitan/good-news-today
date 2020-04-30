import type { IEmitter } from "../../../Interfaces/Options/Emitters/IEmitter";
import type { RecursivePartial } from "../../../Types/RecursivePartial";
import type { ICoordinates } from "../../../Interfaces/ICoordinates";
import { MoveDirection } from "../../../Enums/MoveDirection";
import type { IParticles } from "../../../Interfaces/Options/Particles/IParticles";
import { EmitterRate } from "./EmitterRate";
import { EmitterLife } from "./EmitterLife";
import type { IDimension } from "../../../Interfaces/IDimension";
export declare class Emitter implements IEmitter {
    size?: IDimension;
    direction: MoveDirection;
    life: EmitterLife;
    particles?: RecursivePartial<IParticles>;
    position?: ICoordinates;
    rate: EmitterRate;
    constructor();
    load(data?: RecursivePartial<IEmitter>): void;
}
