declare namespace JSX {
  interface IntrinsicElements {
    // div: { className?: string };
    div: any;
    span: {};
    // 任意のタグを許可するための定義
    [elemName: string]: any;
  }
}
