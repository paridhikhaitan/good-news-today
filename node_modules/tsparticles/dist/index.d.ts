import type { Container } from "./Classes/Container";
import type { IOptions } from "./Interfaces/Options/IOptions";
import type { RecursivePartial } from "./Types/RecursivePartial";
import type { IShapeDrawer } from "./Interfaces/IShapeDrawer";
import type { ShapeDrawerFunction } from "./Types/ShapeDrawerFunction";
declare global {
    interface Window {
        customRequestAnimationFrame: (callback: FrameRequestCallback) => number;
        mozRequestAnimationFrame: (callback: FrameRequestCallback) => number;
        oRequestAnimationFrame: (callback: FrameRequestCallback) => number;
        msRequestAnimationFrame: (callback: FrameRequestCallback) => number;
        customCancelRequestAnimationFrame: (handle: number) => void;
        webkitCancelRequestAnimationFrame: (handle: number) => void;
        mozCancelRequestAnimationFrame: (handle: number) => void;
        oCancelRequestAnimationFrame: (handle: number) => void;
        msCancelRequestAnimationFrame: (handle: number) => void;
        particlesJS: any;
        tsParticles: Main;
        pJSDom: () => Container[];
    }
}
declare class Main {
    private initialized;
    constructor();
    init(): void;
    loadFromArray(tagId: string, params: RecursivePartial<IOptions>[], index?: number): Promise<Container | undefined>;
    load(tagId: string, params: RecursivePartial<IOptions>): Promise<Container | undefined>;
    loadJSON(tagId: string, pathConfigJson: string): Promise<Container | undefined>;
    setOnClickHandler(callback: EventListenerOrEventListenerObject): void;
    dom(): Container[];
    domItem(index: number): Container | undefined;
    addShape(shape: string, drawer: IShapeDrawer | ShapeDrawerFunction): void;
    addPreset(preset: string, options: RecursivePartial<IOptions>): void;
}
declare const tsParticles: Main;
export { tsParticles };
