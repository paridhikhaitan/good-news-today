import type { IShapeDrawer } from "../../Interfaces/IShapeDrawer";
import type { IParticle } from "../../Interfaces/IParticle";
export declare class TextDrawer implements IShapeDrawer {
    draw(context: CanvasRenderingContext2D, particle: IParticle, radius: number, _opacity: number): void;
}
