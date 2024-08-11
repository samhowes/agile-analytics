import * as d3 from "d3";

export declare type ContainerSelection = d3.Selection<SVGGElement, unknown, null, undefined>;

export declare type ElementSelection<TElement extends d3.BaseType> = d3.Selection<TElement, unknown, null, undefined>;
export declare type DataSelection<TElement extends d3.BaseType, TData> = d3.Selection<TElement, TData, SVGGElement, undefined>;
