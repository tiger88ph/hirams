import echo from "../../lib/echo.js";

export function subscribeSupplierContactsChannel() {
  const channel = echo.channel("supplier-contacts");

  channel.listen(".supplier-contact.updated", (e) => {
    if (e.action === "deleted") {
      window.dispatchEvent(
        new CustomEvent("supplier_contact_deleted", {
          detail: { supplierId: e.supplierId, contactId: e.contactId },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("supplier_contact_updated", { detail: e })
      );
    }
  });

  return () => echo.leaveChannel("supplier-contacts");
}