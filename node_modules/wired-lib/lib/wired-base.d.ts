import { LitElement, PropertyValues } from 'lit-element';
import { Point } from './wired-lib';
export declare type ResizeObserver = any;
export declare const BaseCSS: import("lit-element").CSSResult;
export declare abstract class WiredBase extends LitElement {
    protected svg?: SVGSVGElement;
    protected lastSize: Point;
    updated(_changed?: PropertyValues): void;
    wiredRender(force?: boolean): void;
    protected abstract canvasSize(): Point;
    protected abstract draw(svg: SVGSVGElement, size: Point): void;
}
