export type Fiber = {
  type: any;
  props: any;
  hooks: any[] | null;
  dom: any | null;
  parent: Fiber;
  child: Fiber | null;
  sibling: Fiber | null;
  alternate: Fiber | null;
  effectTag?: "PLACEMENT" | "UPDATE" | "DELETION";
};

export type RootFiber = {
  props: any;
  hooks: any[] | null;
  dom: any | null;
  child: Fiber | null;
  sibling: Fiber | null;
  alternate: RootFiber | null;
};
