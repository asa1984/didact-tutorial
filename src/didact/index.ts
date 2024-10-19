import type { Fiber } from "./types";
import { updateDom } from "./dom";
import { createElement } from "./jsx";

let nextUnitOfWork: any = null;
let currentRoot: any = null;
let wipRoot: any = null;
let deletions: any[] = [];

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot!.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber: Fiber | null) {
  if (!fiber) return;

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate!.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber: Fiber, domParent: any) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    if (!fiber.child) return;
    commitDeletion(fiber.child, domParent);
  }
}

function render(element: any, container: HTMLElement) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

function workLoop(deadline: IdleDeadline) {
  let shouldYeield = false;
  while (nextUnitOfWork && !shouldYeield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYeield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber: Fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) return fiber.child;

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;

    nextFiber = nextFiber.parent;
  }
}

let wipFiber: Fiber | null = null;
let hookIndex: any = null;

function updateFunctionComponent(fiber: Fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function useState<T>(
  initial: T,
): [T, (action: (prevState: T) => void) => void] {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex];
  const hook = {
    state: oldHook ? (oldHook.state as T) : initial,
    queue: [] as any[],
  };

  const actions: any[] = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action: (prevState: T) => void) => {
    hook.queue.push(action);

    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber?.hooks?.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(wipFiber: any, elements: any[]) {
  let index = 0;

  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling: Fiber | null = null;

  while (index < elements.length || oldFiber !== null) {
    const element = elements[index];
    let newFiber: Fiber | null = null;

    const sameType = oldFiber && element && element.type === oldFiber.type;

    // Update DOM node
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        hooks: null,
        dom: oldFiber.dom,
        parent: wipFiber,
        child: null,
        sibling: null,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    // Add DOM node
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        hooks: null,
        dom: null,
        parent: wipFiber,
        child: null,
        sibling: null,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }

    // Delete DOM node
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling!.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

function createDom(fiber: Fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

// Bootstrap
requestIdleCallback(workLoop);

export { createElement, render, useState };
export default { createElement, render, useState };
