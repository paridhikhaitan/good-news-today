import type { IShapeDrawer } from "../../Interfaces/IShapeDrawer";
import type { IParticle } from "../../Interfaces/IParticle";
export declare class ImageDrawer implements IShapeDrawer {
    draw(context: CanvasRenderingContext2D, particle: IParticle, radius: number, opacity: number): void;
}
