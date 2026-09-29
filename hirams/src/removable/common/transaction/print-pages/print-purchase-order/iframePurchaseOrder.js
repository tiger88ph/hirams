import { buildIframeTemplate } from "../iframeGlobal";

export const iframeTemplate = buildIframeTemplate({
  columnLimit: 10,
  printFnName: "__printPO",
  pageSize: "A4 portrait",
});

export default iframeTemplate;
