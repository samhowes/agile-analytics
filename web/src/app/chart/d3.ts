import * as d3 from "d3";
import {BaseType} from "d3";

export declare type ContainerSelection = d3.Selection<SVGGElement, unknown, null, undefined>;

export declare type ElementSelection<TElement extends d3.BaseType> = d3.Selection<TElement, unknown, null, undefined>;
export declare type DataSelection<TElement extends d3.BaseType, TData> = d3.Selection<TElement, TData, SVGGElement, undefined>;

export declare type Transition = d3.Transition<BaseType, any, any, any>
export declare type SelectionLike<TData> = Transition | d3.Transition<SVGGElement, TData, any, any>

export class D3 {
  static applyTransition<TOut>(selection: TOut, transition: Transition | null): TOut {
    if (transition === null)
      return selection as unknown as TOut
    return (selection as unknown as d3.Selection<BaseType, any, any, any>)
      .transition(transition) as unknown as TOut
  }
}
