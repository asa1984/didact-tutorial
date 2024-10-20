import type { Fiber } from "./types";

const isEvent = (key: string) => key.startsWith("on");
const isProperty = (key: string) => key !== "children" && !isEvent(key);
const isNew = (prev: any, next: any) => (key: string) =>
  prev[key] !== next[key];
const isGone = (_prev: any, next: any) => (key: string) => !(key in next);

export function createDom(fiber: Fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

export function updateDom(dom: HTMLElement, prevProps: any, nextProps: any) {
  // Remove changed event listeners temporary
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Replace gone properties with empty strings
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      // @ts-expect-error
      dom[name] = "";
    });

  // Add new properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      // @ts-expect-error
      dom[name] = nextProps[name];
    });

  // Add event listeners in new properties
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}
