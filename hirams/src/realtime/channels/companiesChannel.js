import echo from "../../lib/echo";

export function subscribeCompaniesChannel() {
  const channel = echo.channel("companies");

  channel.listen(".company.updated", (event) => {
    const { action, companyId } = event;
    console.log("[CompaniesChannel] Event received:", event);

    if (action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("company_data_deleted", {
          detail: { companyId },
        })
      );
    } else {
      // created / updated → refresh list
      window.dispatchEvent(new CustomEvent("company_data_updated"));
    }
  });

  return () => echo.leaveChannel("companies");
}