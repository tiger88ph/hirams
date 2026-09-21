import React from "react";
import PageLayout from "../../../../../../layouts/page/content-page/index.jsx";
import { fmtPHP } from "../../../../../../utils/formatters/formatter.js";
import PrintPreview from "../../../../../../components/print-preview/PrintPreview.jsx";
import EditableCell from "../../../../../../components/print-preview/EditableCell.jsx";
import MediaRoute from "../../../../../../routes/MediaRoute.jsx";

const DOC = {
  headerBg: "#B3BECD",
  fillBg: "#E5E7EB",
  rowGray: "#F1F5F9",
  border: "#94A3B8",
  text: "#1E293B",
};

const cellSx = {
  border: `1.5px solid ${DOC.border}`,
  px: 1,
  py: 0.5,
  fontSize: "0.7rem",
  verticalAlign: "middle",
  color: DOC.text,
};

const TABLE_STYLE = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const sectionHeaderSx = {
  ...cellSx,
  backgroundColor: DOC.headerBg,
  fontWeight: 700,
  textAlign: "center",
};

// 9 equal columns, reused across all three tables so columns line up
// visually even though header/items/footer are separate <table> elements
// (same pattern as COLGROUP in the PO preview).
const COLGROUP = (
  <colgroup>
    {Array.from({ length: 9 }).map((_, i) => (
      <col key={i} style={{ width: `${(100 / 9).toFixed(4)}%` }} />
    ))}
  </colgroup>
);

const DEFAULTS = {
  voucherNo: "—",
  tin: "",
  date: "",
  payeeName: "—",
  payeeAddress: "",
  items: [],
  ewtDiscount: 0,

  companyName: "",
  companyLogo: null,
};

function VoucherHeaderTable({
  voucherNo,
  tin,
  payeeName,
  payeeAddress,
  companyName,
  companyLogo,
}) {
  const logoSrc = MediaRoute.resolveCompanyLogo({ strLogo: companyLogo });

  return (
    <table style={TABLE_STYLE}>
      {COLGROUP}
      <tbody>
        {companyLogo && logoSrc && (
          <tr>
            <td
              colSpan={9}
              style={{
                ...cellSx,
                border: "none",
                textAlign: "center",
                verticalAlign: "middle",
                height: 60,
              }}
            >
              <img
                src={logoSrc}
                alt={`${companyName} logo`}
                style={{
                  maxWidth: "160px",
                  maxHeight: "48px",
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </td>
          </tr>
        )}
        <tr>
          <td
            colSpan={9}
            style={{
              ...cellSx,
              backgroundColor: DOC.headerBg,
              fontWeight: 700,
              fontSize: "1.1rem",
              textAlign: "center",
            }}
          >
            DISBURSEMENT VOUCHER
          </td>
        </tr>

        <tr>
          <td colSpan={6} style={{ ...cellSx, fontStyle: "italic" }}>
            <b style={{ fontStyle: "normal" }}>Payee:</b>{" "}
            <EditableCell.Inline
              id="payeeName"
              initialValue={payeeName}
              placeholder="Payee name"
            />
          </td>
          <td colSpan={3} style={{ ...cellSx, fontStyle: "italic" }}>
            <b style={{ fontStyle: "normal" }}>NO. DV:</b>{" "}
            <EditableCell.Inline
              id="voucherNo"
              initialValue={voucherNo}
              placeholder="DV No."
            />
          </td>
        </tr>
        <tr>
          <td colSpan={6} style={{ ...cellSx, fontStyle: "italic" }}>
            <b style={{ fontStyle: "normal" }}>Address:</b>{" "}
            <EditableCell.Inline
              id="payeeAddress"
              initialValue={payeeAddress}
              placeholder="Address"
            />
          </td>
          <td colSpan={3} style={{ ...cellSx, fontStyle: "italic" }}>
            <b style={{ fontStyle: "normal" }}>TIN:</b>{" "}
            <EditableCell.Inline
              id="tin"
              initialValue={tin}
              placeholder="TIN"
            />
          </td>
        </tr>

        <tr>
          <td colSpan={3} style={sectionHeaderSx}>
            PARTICULARS
          </td>
          <td colSpan={1} style={sectionHeaderSx}>
            QTY
          </td>
          <td colSpan={1} style={sectionHeaderSx}>
            UOM
          </td>
          <td colSpan={2} style={sectionHeaderSx}>
            UNIT PRICE
          </td>
          <td colSpan={2} style={sectionHeaderSx}>
            AMOUNT
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function VoucherItemsTable({ items }) {
  return (
    <table style={TABLE_STYLE}>
      {COLGROUP}
      <tbody>
        {items.map((item, idx) => {
          // Prefer a stable identity (e.g. a PO/particular id) over the
          // array index — if `items` is ever re-sorted or filtered, an
          // index-based id can silently attach an edit to the wrong row.
          const rowId = item.id ?? item.particular ?? idx;
          return (
            <tr key={idx}>
              <EditableCell
                id={`item-${rowId}-particular`}
                colSpan={3}
                style={{ ...cellSx, backgroundColor: DOC.rowGray }}
                align="left"
                initialValue={item.particular}
              />
              <EditableCell
                id={`item-${rowId}-qty`}
                colSpan={1}
                style={{
                  ...cellSx,
                  textAlign: "center",
                  backgroundColor: DOC.rowGray,
                }}
                align="center"
                initialValue={item.qty}
              />
              <EditableCell
                id={`item-${rowId}-uom`}
                colSpan={1}
                style={{
                  ...cellSx,
                  textAlign: "center",
                  backgroundColor: DOC.rowGray,
                }}
                align="center"
                initialValue={item.uom}
              />
              <EditableCell
                id={`item-${rowId}-unitPrice`}
                colSpan={2}
                style={{
                  ...cellSx,
                  textAlign: "right",
                  backgroundColor: DOC.rowGray,
                }}
                align="right"
                initialValue={item.unitPrice}
                formatDisplay={(v) => fmtPHP(Number(v) || 0)}
              />
              <EditableCell
                id={`item-${rowId}-amount`}
                colSpan={2}
                style={{
                  ...cellSx,
                  textAlign: "right",
                  fontWeight: 700,
                  fontStyle: "italic",
                  backgroundColor: DOC.rowGray,
                }}
                align="right"
                initialValue={item.qty * item.unitPrice}
                formatDisplay={(v) => fmtPHP(Number(v) || 0)}
              />
            </tr>
          );
        })}
        <tr>
          <td
            colSpan={9}
            style={{
              border: "none",
              height: "10px",
              backgroundColor: "transparent",
            }}
          />
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Mode-of-Payment cell styling.
 * cPaymentTerms holds the *key* for whichever mode was selected
 * (e.g. cashKey / creditCardKey / chequeKey / otherPaymentTermKey),
 * so we compare directly against those keys — no label-guessing needed.
 */
function modeCellSx(isSelected) {
  return {
    ...cellSx,
    textAlign: "center",
    fontWeight: isSelected ? 700 : 500,
    backgroundColor: isSelected ? "#FDE68A" : undefined,
  };
}

function VoucherFooterTable({
  subtotal,
  ewtDiscount,
  payable,
  accountRows = [],
  cPaymentTerms,
  cashKey,
  creditCardKey,
  chequeKey,
  otherPaymentTermKey,
  cashLabel,
  creditCardLabel,
  chequeLabel,
  otherPaymentTermLabel,

  date,
}) {
  const rows = accountRows.length
    ? accountRows
    : [{ id: "empty", title: "", fromAmount: null, toAmount: null }];

  const totalFrom = rows.reduce((s, r) => s + (Number(r.fromAmount) || 0), 0);
  const totalTo = rows.reduce((s, r) => s + (Number(r.toAmount) || 0), 0);
  const paidTerm = String(cPaymentTerms ?? "");
  const isCash = !!cashKey && paidTerm === String(cashKey);
  const isCreditCard = !!creditCardKey && paidTerm === String(creditCardKey);
  const isCheque = !!chequeKey && paidTerm === String(chequeKey);
  const isOther =
    !!otherPaymentTermKey && paidTerm === String(otherPaymentTermKey);

  return (
    <table style={TABLE_STYLE}>
      {COLGROUP}
      <tbody>
        <tr>
          <td
            colSpan={7}
            style={{
              ...cellSx,
              fontWeight: 500,
              textAlign: "right",
              fontSize: "0.6rem",
              fontStyle: "italic",
            }}
          >
            SUB-TOTAL
          </td>
          <EditableCell
            id="subtotalOverride"
            colSpan={2}
            style={{ ...cellSx, textAlign: "right" }}
            align="right"
            initialValue={subtotal}
            formatDisplay={(v) => fmtPHP(Number(v) || 0)}
          />
        </tr>
        <tr>
          <td
            colSpan={7}
            style={{
              ...cellSx,
              fontWeight: 500,
              textAlign: "right",
              fontSize: "0.6rem",
              fontStyle: "italic",
            }}
          >
            Less: EWT/DISC
          </td>
          <EditableCell
            id="ewtDiscountOverride"
            colSpan={2}
            style={{ ...cellSx, textAlign: "right" }}
            align="right"
            initialValue={ewtDiscount}
            formatDisplay={(v) => fmtPHP(Number(v) || 0)}
          />
        </tr>
        <tr>
          <td
            colSpan={5}
            style={{
              ...cellSx,
              backgroundColor: DOC.fillBg,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            TOTAL
          </td>
          <td
            colSpan={2}
            style={{
              ...cellSx,
              backgroundColor: DOC.fillBg,
              fontWeight: 700,
              textAlign: "right",
            }}
          >
            AMOUNT PAYABLE
          </td>
          <EditableCell
            id="payableOverride"
            colSpan={2}
            style={{
              ...cellSx,
              backgroundColor: DOC.fillBg,
              fontWeight: 700,
              textAlign: "right",
            }}
            align="right"
            initialValue={payable}
            formatDisplay={(v) => fmtPHP(Number(v) || 0)}
          />
        </tr>
        {/* spacer row */}
        <tr>
          <td
            colSpan={9}
            style={{
              border: "none",
              height: "10px",
              backgroundColor: "transparent",
            }}
          />
        </tr>
        <tr>
          <td colSpan={5} style={sectionHeaderSx}>
            Account Title
          </td>
          <td colSpan={2} style={sectionHeaderSx}>
            FROM
          </td>
          <td colSpan={2} style={sectionHeaderSx}>
            TO
          </td>
        </tr>
        {rows.map((row) => (
          <tr key={row.id}>
            <EditableCell
              id={`accountRow-${row.id}-title`}
              colSpan={5}
              style={{ ...cellSx, fontWeight: 600, textAlign: "center" }}
              align="left"
              initialValue={row.title}
            />
            <EditableCell
              id={`accountRow-${row.id}-from`}
              colSpan={2}
              style={{ ...cellSx, textAlign: "right", height: 22 }}
              align="right"
              initialValue={row.fromAmount ?? ""}
              formatDisplay={(v) => (v === "" ? "" : fmtPHP(Number(v) || 0))}
            />
            <EditableCell
              id={`accountRow-${row.id}-to`}
              colSpan={2}
              style={{ ...cellSx, textAlign: "right", height: 22 }}
              align="right"
              initialValue={row.toAmount ?? ""}
              formatDisplay={(v) => (v === "" ? "" : fmtPHP(Number(v) || 0))}
            />
          </tr>
        ))}
        {/* account total row */}
        <tr>
          <td
            colSpan={5}
            style={{
              ...cellSx,
              backgroundColor: DOC.fillBg,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            TOTAL
          </td>
          <EditableCell
            id="accountTotalFromOverride"
            colSpan={2}
            style={{
              ...cellSx,
              backgroundColor: DOC.fillBg,
              fontWeight: 700,
              textAlign: "right",
            }}
            align="right"
            initialValue={totalFrom}
            formatDisplay={(v) => fmtPHP(Number(v) || 0)}
          />
          <EditableCell
            id="accountTotalToOverride"
            colSpan={2}
            style={{
              ...cellSx,
              backgroundColor: DOC.fillBg,
              fontWeight: 700,
              textAlign: "right",
            }}
            align="right"
            initialValue={totalTo}
            formatDisplay={(v) => fmtPHP(Number(v) || 0)}
          />
        </tr>
        {/* doc completeness row */}
        <tr>
          <td
            colSpan={4}
            style={{
              ...sectionHeaderSx,
              borderRight: `2px solid ${DOC.border}`,
            }}
          >
            Documents Completeness
          </td>
          <td colSpan={3} style={sectionHeaderSx}>
            Cash Availability
          </td>
          <td colSpan={1} style={sectionHeaderSx}>
            CTRL NO.:
          </td>

          <EditableCell
            id="ctrlNo"
            colSpan={1}
            style={cellSx}
            align="center"
            placeholder="Enter CTRL No."
          />
        </tr>
        {/* mode of pay row */}
        <tr>
          <EditableCell
            id="documentsCompletenessNote"
            colSpan={4}
            rowSpan={1}
            style={{
              ...cellSx,
              borderRight: `2px solid ${DOC.border}`,
            }}
            align="center"
            placeholder="Notes"
          />
          <td
            colSpan={1}
            style={{
              ...cellSx,
              fontWeight: 700,
              fontSize: ".5rem",
              textAlign: "center",
            }}
          >
            Mode of Payment:
          </td>
          <td colSpan={1} style={modeCellSx(isCash)}>
            {cashLabel}
          </td>
          <td colSpan={1} style={modeCellSx(isCreditCard)}>
            {creditCardLabel}
          </td>
          <td colSpan={1} style={modeCellSx(isCheque)}>
            {chequeLabel}
          </td>
          <td colSpan={1} style={modeCellSx(isOther)}>
            {otherPaymentTermLabel}
          </td>
        </tr>
        {/* cheque ref row */}
        <tr>
          <EditableCell
            id="documentsCompletenessNote2"
            colSpan={4}
            rowSpan={1}
            style={{
              ...cellSx,
              borderRight: `2px solid ${DOC.border}`,
            }}
            align="center"
            placeholder="Name / Signature"
          />
          <EditableCell
            id="cashAvailabilityNote"
            colSpan={3}
            style={cellSx}
            align="center"
            placeholder="Name / Signature"
          />
          <td
            colSpan={1}
            style={{
              ...cellSx,
              fontStyle: "italic",
              fontSize: "0.55rem",
              textAlign: "center",
            }}
          >
            Cheque/Ref No & Date:
          </td>
          <EditableCell
            id="chequeRefNoAndDate"
            colSpan={1}
            style={cellSx}
            align="center"
            placeholder="Ref No"
          />
        </tr>
        {/* signature over row */}
        <tr>
          <td
            colSpan={4}
            rowSpan={1}
            style={{
              ...cellSx,
              borderRight: `2px solid ${DOC.border}`,
              textAlign: "center",
            }}
          >
            Signature over Name / Date
          </td>
          <td
            colSpan={3}
            style={{ ...cellSx, textAlign: "center", fontStyle: "italic" }}
          >
            Signature over Name / Date
          </td>
          <EditableCell
            id="ctrlSignatureSlot"
            colSpan={2}
            style={cellSx}
            align="center"
            placeholder="Ref Date"
          />
        </tr>
        {/* approved row */}
        <tr>
          <td colSpan={3} style={sectionHeaderSx}>
            Approved for Payment
          </td>
          <td colSpan={3} style={sectionHeaderSx}>
            Processed by:
          </td>
          <td colSpan={2} style={sectionHeaderSx}>
            Received Payment
          </td>
          <td colSpan={1} style={sectionHeaderSx} />
        </tr>
        {/* blank signature row */}
        <tr>
          <EditableCell
            id="signatureApprovedForPayment"
            colSpan={3}
            style={{ ...cellSx, height: 40 }}
            align="center"
            verticalAlign="bottom"
            placeholder="Name / Signature"
          />
          <EditableCell
            id="signatureProcessedBy"
            colSpan={3}
            style={{ ...cellSx, height: 40 }}
            align="center"
            verticalAlign="bottom"
            placeholder="Name / Signature"
          />
          <EditableCell
            id="signatureReceivedPayment"
            colSpan={3}
            style={{ ...cellSx, height: 40 }}
            align="center"
            verticalAlign="bottom"
            placeholder="Name / Signature"
          />
        </tr>
        {/* signature over row */}
        <tr>
          <td
            colSpan={3}
            style={{ ...cellSx, textAlign: "center", fontStyle: "italic" }}
          >
            Signature over Name / Date
          </td>
          <td
            colSpan={3}
            style={{ ...cellSx, textAlign: "center", fontStyle: "italic" }}
          >
            Signature over Name / Date
          </td>
          <EditableCell
            id="receivedPaymentSignatureSlot"
            colSpan={3}
            style={cellSx}
            align="center"
            placeholder="Name / Date"
          />
        </tr>
        {/* prepared row */}
        <tr>
          <td colSpan={1} style={{ ...cellSx, fontWeight: 700 }}>
            Prepared By:
          </td>
          <EditableCell
            id="preparedByName"
            colSpan={2}
            style={cellSx}
            align="left"
            placeholder="Name"
          />
          <td colSpan={1} style={{ ...cellSx, fontWeight: 700 }}>
            Receipt No:
          </td>
          <EditableCell
            id="receiptNo"
            colSpan={2}
            style={cellSx}
            align="left"
            placeholder="Receipt No."
          />
          <td colSpan={1} style={{ ...cellSx, fontWeight: 700 }}>
            Date:
          </td>
          <EditableCell
            id="date"
            colSpan={2}
            style={cellSx}
            align="left"
            placeholder="Date"
          />
        </tr>
      </tbody>
    </table>
  );
}

export default function PreviewVoucherView({
  voucherNo = DEFAULTS.voucherNo,
  tin = DEFAULTS.tin,
  date = DEFAULTS.date,
  payeeName = DEFAULTS.payeeName,
  payeeAddress = DEFAULTS.payeeAddress,
  items = DEFAULTS.items,
  ewtDiscount = DEFAULTS.ewtDiscount,
  companyName = DEFAULTS.companyName,
  companyLogo = DEFAULTS.companyLogo,
  accountRows = [],
  cPaymentTerms,
  cashKey,
  creditCardKey,
  chequeKey,
  otherPaymentTermKey,
  cashLabel,
  creditCardLabel,
  chequeLabel,
  otherPaymentTermLabel,
}) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const payable = subtotal - ewtDiscount;

  return (
    <PageLayout
      title="Voucher Preview"
      subtitle="Quick overview"
      upDownIndicator={false}
    >
      <PrintPreview
        onExport={() => console.log("wire up export")}
        header={
          <VoucherHeaderTable
            voucherNo={voucherNo}
            tin={tin}
            payeeName={payeeName}
            payeeAddress={payeeAddress}
            companyName={companyName}
            companyLogo={companyLogo}
          />
        }
        footer={
          <VoucherFooterTable
            subtotal={subtotal}
            ewtDiscount={ewtDiscount}
            payable={payable}
            accountRows={accountRows}
            cPaymentTerms={cPaymentTerms}
            cashKey={cashKey}
            creditCardKey={creditCardKey}
            chequeKey={chequeKey}
            otherPaymentTermKey={otherPaymentTermKey}
            cashLabel={cashLabel}
            creditCardLabel={creditCardLabel}
            chequeLabel={chequeLabel}
            otherPaymentTermLabel={otherPaymentTermLabel}
            date={date}
          />
        }
      >
        <VoucherItemsTable items={items} />
      </PrintPreview>
    </PageLayout>
  );
}
