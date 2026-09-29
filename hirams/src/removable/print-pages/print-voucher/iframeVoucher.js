import { buildIframeTemplate } from "../iframeGlobal";

export const iframeTemplate = buildIframeTemplate({
  columnLimit: 14,
  printFnName: "__printVoucher",
  pageSize: "A4 landscape",
});

export default iframeTemplate;
