import type { IOptionLoader } from "../IOptionLoader";
import type { ICoordinates } from "../../ICoordinates";
import type { MoveDirection } from "../../../Enums/MoveDirection";
import type { IParticles } from "../Particles/IParticles";
import type { IEmitterRate } from "./IEmitterRate";
import type { IEmitterLife } from "./IEmitterLife";
import type { IDimension } from "../../IDimension";
import type { RecursivePartial } from "../../../Types/RecursivePartial";
export interface IEmitter extends IOptionLoader<IEmitter> {
    size?: IDimension;
    direction: MoveDirection;
    life: IEmitterLife;
    particles?: RecursivePartial<IParticles>;
    position?: ICoordinates;
    rate: IEmitterRate;
}
