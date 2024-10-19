import Didact from "./didact";

/** @jsx Didact.createElement */
export function Counter() {
  const [count, setCount] = Didact.useState(0);
  return (
    <div>
      <h1>Counter</h1>
      <button
        onClick={() => {
          setCount((prev) => prev + 1);
        }}
      >
        Count: {count}
      </button>
    </div>
  );
}
