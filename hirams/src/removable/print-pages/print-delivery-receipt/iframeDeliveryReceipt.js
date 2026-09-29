import { buildIframeTemplate } from "../iframeGlobal";

export const iframeTemplate = buildIframeTemplate({
  columnLimit: 9,
  printFnName: "__printDR",
  pageSize: "A4 portrait",
});

export default iframeTemplate;
