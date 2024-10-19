import Didact from "./didact";
import { Counter } from "./Counter";

const element = <Counter />;

const container = document.getElementById("root");
if (!container) throw "Root element was not found";
Didact.render(element, container);
