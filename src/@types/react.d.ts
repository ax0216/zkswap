/**
 * Stub type declarations for React
 * These declarations allow TypeScript to compile without @types/react installed
 */

declare module 'react' {
  export type ReactNode =
    | string
    | number
    | boolean
    | null
    | undefined
    | ReactElement
    | ReactNode[];

  export interface ReactElement<P = any> {
    type: string | ComponentType<P>;
    props: P;
    key: string | number | null;
  }

  export type ComponentType<P = {}> = FunctionComponent<P> | ComponentClass<P>;

  export interface FunctionComponent<P = {}> {
    (props: P): ReactElement | null;
    displayName?: string;
  }

  export interface ComponentClass<P = {}> {
    new(props: P): Component<P>;
  }

  export class Component<P = {}, S = {}> {
    props: P;
    state: S;
    setState(state: Partial<S>): void;
    render(): ReactNode;
  }

  export interface ChangeEvent<T = Element> {
    target: EventTarget & T;
    currentTarget: EventTarget & T;
    preventDefault(): void;
    stopPropagation(): void;
  }

  export interface FormEvent<T = Element> {
    target: EventTarget & T;
    currentTarget: EventTarget & T;
    preventDefault(): void;
    stopPropagation(): void;
  }

  export interface MouseEvent<T = Element> {
    target: EventTarget & T;
    currentTarget: EventTarget & T;
    preventDefault(): void;
    stopPropagation(): void;
  }

  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: unknown[]): T;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useContext<T>(context: Context<T>): T;

  export interface Context<T> {
    Provider: ComponentType<{ value: T; children?: ReactNode }>;
    Consumer: ComponentType<{ children: (value: T) => ReactNode }>;
    displayName?: string;
  }

  export function createContext<T>(defaultValue: T): Context<T>;

  // Common HTML attributes with key prop
  export interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // React-specific Attributes
    defaultChecked?: boolean;
    defaultValue?: string | number | ReadonlyArray<string>;
    suppressContentEditableWarning?: boolean;
    suppressHydrationWarning?: boolean;

    // Standard HTML Attributes
    accessKey?: string;
    className?: string;
    contentEditable?: boolean | "true" | "false" | "inherit";
    contextMenu?: string;
    dir?: string;
    draggable?: boolean | "true" | "false";
    hidden?: boolean;
    id?: string;
    lang?: string;
    placeholder?: string;
    slot?: string;
    spellCheck?: boolean | "true" | "false";
    style?: CSSProperties;
    tabIndex?: number;
    title?: string;
    translate?: "yes" | "no";

    // Form attributes
    disabled?: boolean;
    type?: string;
    value?: string | number | readonly string[];
    min?: string | number;
    max?: string | number;
    step?: string | number;
    readOnly?: boolean;
    required?: boolean;
    name?: string;
    autoFocus?: boolean;
    autoComplete?: string;

    // Key prop for lists
    key?: string | number | null;

    // Event handlers
    onClick?: (event: MouseEvent<T>) => void;
    onChange?: (event: ChangeEvent<T>) => void;
    onSubmit?: (event: FormEvent<T>) => void;
    onFocus?: (event: any) => void;
    onBlur?: (event: any) => void;
    onKeyDown?: (event: any) => void;
    onKeyUp?: (event: any) => void;

    // Children
    children?: ReactNode;
  }

  export interface AriaAttributes {
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-hidden'?: boolean | "true" | "false";
    'aria-describedby'?: string;
    'aria-expanded'?: boolean | "true" | "false";
    'aria-haspopup'?: boolean | "true" | "false" | "menu" | "listbox" | "tree" | "grid" | "dialog";
    'aria-controls'?: string;
    'aria-selected'?: boolean | "true" | "false";
  }

  export interface DOMAttributes<T> {}

  export interface CSSProperties {
    [key: string]: string | number | undefined;
  }

  export interface SVGAttributes<T> extends HTMLAttributes<T> {
    viewBox?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: string | number;
    strokeLinecap?: "butt" | "round" | "square";
    strokeLinejoin?: "miter" | "round" | "bevel";
    d?: string;
    cx?: string | number;
    cy?: string | number;
    r?: string | number;
    width?: string | number;
    height?: string | number;
    xmlns?: string;
  }
}

declare global {
  namespace JSX {
    interface Element extends React.ReactElement {}
    interface ElementClass extends React.Component<any, any> {}
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }

    interface IntrinsicElements {
      // HTML elements
      div: React.HTMLAttributes<HTMLDivElement>;
      span: React.HTMLAttributes<HTMLSpanElement>;
      p: React.HTMLAttributes<HTMLParagraphElement>;
      h1: React.HTMLAttributes<HTMLHeadingElement>;
      h2: React.HTMLAttributes<HTMLHeadingElement>;
      h3: React.HTMLAttributes<HTMLHeadingElement>;
      h4: React.HTMLAttributes<HTMLHeadingElement>;
      h5: React.HTMLAttributes<HTMLHeadingElement>;
      h6: React.HTMLAttributes<HTMLHeadingElement>;
      button: React.HTMLAttributes<HTMLButtonElement>;
      input: React.HTMLAttributes<HTMLInputElement>;
      select: React.HTMLAttributes<HTMLSelectElement>;
      option: React.HTMLAttributes<HTMLOptionElement>;
      label: React.HTMLAttributes<HTMLLabelElement>;
      form: React.HTMLAttributes<HTMLFormElement>;
      a: React.HTMLAttributes<HTMLAnchorElement> & { href?: string; target?: string; rel?: string };
      img: React.HTMLAttributes<HTMLImageElement> & { src?: string; alt?: string };
      ul: React.HTMLAttributes<HTMLUListElement>;
      ol: React.HTMLAttributes<HTMLOListElement>;
      li: React.HTMLAttributes<HTMLLIElement>;
      table: React.HTMLAttributes<HTMLTableElement>;
      thead: React.HTMLAttributes<HTMLTableSectionElement>;
      tbody: React.HTMLAttributes<HTMLTableSectionElement>;
      tr: React.HTMLAttributes<HTMLTableRowElement>;
      th: React.HTMLAttributes<HTMLTableCellElement>;
      td: React.HTMLAttributes<HTMLTableCellElement>;
      nav: React.HTMLAttributes<HTMLElement>;
      header: React.HTMLAttributes<HTMLElement>;
      footer: React.HTMLAttributes<HTMLElement>;
      main: React.HTMLAttributes<HTMLElement>;
      section: React.HTMLAttributes<HTMLElement>;
      article: React.HTMLAttributes<HTMLElement>;
      aside: React.HTMLAttributes<HTMLElement>;
      br: React.HTMLAttributes<HTMLBRElement>;
      hr: React.HTMLAttributes<HTMLHRElement>;
      pre: React.HTMLAttributes<HTMLPreElement>;
      code: React.HTMLAttributes<HTMLElement>;

      // SVG elements
      svg: React.SVGAttributes<SVGSVGElement>;
      path: React.SVGAttributes<SVGPathElement>;
      circle: React.SVGAttributes<SVGCircleElement>;
      rect: React.SVGAttributes<SVGRectElement>;
      line: React.SVGAttributes<SVGLineElement>;
      polyline: React.SVGAttributes<SVGPolylineElement>;
      polygon: React.SVGAttributes<SVGPolygonElement>;
      g: React.SVGAttributes<SVGGElement>;
      defs: React.SVGAttributes<SVGDefsElement>;
      use: React.SVGAttributes<SVGUseElement>;
    }
  }
}

declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface Element extends React.ReactElement {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }

  export function jsx(type: any, props: any, key?: any): React.ReactElement;
  export function jsxs(type: any, props: any, key?: any): React.ReactElement;
  export const Fragment: React.ComponentType<{ children?: React.ReactNode }>;
}

import React = require('react');
