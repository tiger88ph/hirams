import { buildIframeTemplate } from "../iframeGlobal";

export const iframeTemplate = buildIframeTemplate({
  columnLimit: 9,
  printFnName: "__printSI",
  pageSize: "A4 portrait",
});

export default iframeTemplate;
