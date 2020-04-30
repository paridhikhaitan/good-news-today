import type { Container } from "./Container";
import type { ICoordinates } from "../Interfaces/ICoordinates";
import type { IEmitter } from "../Interfaces/Options/Emitters/IEmitter";
import type { IDimension } from "../Interfaces/IDimension";
export declare class Emitter {
    position: ICoordinates;
    size: IDimension;
    emitterOptions: IEmitter;
    private readonly container;
    private readonly initialPosition?;
    private startInterval?;
    private lifeCount;
    constructor(container: Container, emitterOptions: IEmitter, position?: ICoordinates);
    emit(): void;
    start(): void;
    stop(): void;
    resize(): void;
    private prepareToDie;
    private destroy;
    private calcPosition;
}
