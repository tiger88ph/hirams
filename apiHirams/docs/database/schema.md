# Database Schema — HIRAMS

Database: `lguph_hiramsdb`
Engine: InnoDB | Charset: utf8mb4 (a few legacy tables use `utf8mb4_general_ci` or `latin1`)

**Naming convention:** columns are prefixed by type — `n` = numeric ID, `str` = string, `d` = double/decimal, `dt` = datetime, `c` = char flag/status code, `b` = boolean (tinyint).

**On relationships:** almost all foreign keys in this schema are *implied* by naming convention (e.g. `nClientId` matches `tblclients.nClientId`) rather than enforced with a real `FOREIGN KEY` constraint. The database only has **one** actual FK constraint, noted where it applies.

---

## Core / Framework Tables

### `failed_jobs`
Laravel's log of queued jobs that failed during execution.
- **id** (bigint, PK) — unique row identifier.
- **uuid** (varchar, unique) — the job's unique identifier, used to look up or retry the specific failed job.
- **connection** (text) — which queue connection (e.g. database, redis) the job was running on.
- **queue** (text) — the name of the queue the job was dispatched to.
- **payload** (longtext) — the serialized job data (class, arguments) that was being processed.
- **exception** (longtext) — the full exception/stack trace explaining why the job failed.
- **failed_at** (timestamp) — when the failure occurred.

### `jobs`
Laravel's active queue table — jobs waiting to be processed.
- **id** (bigint, PK) — unique row identifier.
- **queue** (varchar, indexed) — which queue this job belongs to.
- **payload** (longtext) — serialized job data.
- **attempts** (tinyint) — how many times this job has been attempted so far.
- **reserved_at** (int, nullable) — timestamp when a worker picked up/locked this job.
- **available_at** (int) — timestamp when the job becomes eligible to run (used for delays/retries).
- **created_at** (int) — timestamp when the job was queued.

### `job_batches`
Tracks groups of jobs dispatched together as a batch (Laravel batch API).
- **id** (varchar, PK) — batch identifier.
- **name** (varchar) — human-readable batch name.
- **total_jobs** (int) — total number of jobs in the batch.
- **pending_jobs** (int) — how many jobs are still unfinished.
- **failed_jobs** (int) — count of jobs that failed.
- **failed_job_ids** (longtext) — serialized list of failed job IDs.
- **options** (mediumtext, nullable) — serialized batch options/callbacks.
- **cancelled_at** (int, nullable) — timestamp if the batch was cancelled.
- **created_at** (int) — when the batch was created.
- **finished_at** (int, nullable) — when the batch completed.

### `migrations`
Laravel's ledger of which migration files have already run.
- **id** (int, PK) — row identifier.
- **migration** (varchar) — the migration filename.
- **batch** (int) — which deployment/run batch this migration belongs to.

### `personal_access_tokens`
Laravel Sanctum's API token storage, used for authenticating API requests.
- **id** (bigint, PK) — token record identifier.
- **tokenable_type / tokenable_id** (polymorphic, indexed together) — which model (usually a user) this token belongs to.
- **name** (text) — a label for the token (e.g. "mobile app").
- **token** (varchar, unique) — the hashed token value checked on each API request.
- **abilities** (text, nullable) — serialized list of permissions/scopes the token grants.
- **last_used_at** (timestamp, nullable) — last time this token was used to authenticate.
- **expires_at** (timestamp, nullable) — when the token stops being valid.
- **created_at / updated_at** (timestamp, nullable) — standard record timestamps.

---

## Application Tables

### `tblusers`
System users — staff who log in and use the application.
- **nUserId** (bigint, PK) — unique user identifier.
- **strFName / strMName / strLName** (varchar) — first, middle (nullable), and last name.
- **strNickName** (varchar) — short display name used across the UI.
- **cUserType** (char) — role/type code (e.g. admin vs regular staff).
- **strProfileImage** (varchar, nullable) — filename/path of the user's avatar.
- **cSex** (char, nullable) — sex code.
- **strEmail** (varchar, unique) — login email, also used for notifications.
- **strUserName** (varchar, unique) — login username.
- **strPassword** (varchar) — hashed password.
- **strPhoneNo** (varchar) — contact number.
- **remember_token** (varchar, nullable) — Laravel's "remember me" session token.
- **bIsActive** (tinyint, default 1) — whether the account is enabled/can log in.
- **cStatus** (char) — account status code.
- **dtLoggedIn** (timestamp, nullable) — last login time.
- **dtCreatedAt** (timestamp) — when the account was created.

### `tblcompanies`
The issuing/billing company profile(s) the system operates under (supports multi-company use).
- **nCompanyId** (bigint, PK) — unique company identifier.
- **strCompanyName** (varchar) — full legal company name.
- **strCompanyNickName** (varchar) — short name used in the UI.
- **strTIN** (varchar, nullable) — Tax Identification Number.
- **strAddress** (varchar, nullable) — registered business address.
- **strEmail** (varchar, nullable) — company contact email.
- **strLogo** (varchar, nullable) — filename/path of the company logo, used on printed documents.
- **strPhoneNo** (varchar) — company contact number.
- **bVAT** (tinyint) — flag: whether this company is VAT-registered (affects invoice computations).
- **bEWT** (tinyint) — flag: whether Expanded Withholding Tax applies to this company's transactions.

### `tblclients`
Customers the company transacts with (buyers of goods/services).
- **nClientId** (bigint, PK) — unique client identifier.
- **strClientName** (varchar) — full client/company name.
- **strClientNickName** (varchar) — short name used in the UI.
- **strTIN** (varchar, unique, nullable) — client's Tax Identification Number.
- **strAddress** (varchar, nullable) — client's billing/delivery address.
- **strBusinessStyle** (varchar, nullable) — the client's registered business style, printed on invoices.
- **strContactPerson** (varchar, nullable) — primary contact name at the client.
- **strContactNumber** (varchar, nullable) — contact person's phone number.
- **cStatus** (char, default 'A') — active/inactive status code.

### `tblassignees`
Account Officers (AOs) / staff assigned to handle transactions and vouchers.
- **nAssigneeId** (int, PK) — unique assignee identifier.
- **strAssigneeName** (varchar, nullable) — full name of the assignee.
- **strAssigneeNickName** (varchar, nullable) — short display name.
- **strAddress** (varchar, nullable) — assignee's address.
- **strTIN** (varchar, nullable) — Tax Identification Number (used when the assignee is paid via voucher).
- **cStatus** (char, nullable) — active/inactive status code.

### `tblsuppliers`
Vendors the company purchases goods/services from.
- **nSupplierId** (bigint, PK) — unique supplier identifier.
- **strSupplierName** (varchar) — full supplier/company name.
- **strSupplierNickName** (varchar) — short name used in the UI.
- **strAddress** (varchar, nullable) — supplier's business address.
- **strTIN** (varchar, unique, nullable) — supplier's Tax Identification Number.
- **bVAT** (tinyint, default 0) — flag: whether the supplier is VAT-registered.
- **bEWT** (tinyint, default 0) — flag: whether EWT is withheld on payments to this supplier.
- **cStatus** (char, nullable) — active/inactive status code.

### `tblsuppliercontacts`
Contact persons for a given supplier. Links to `tblsuppliers` via **nSupplierId**.
- **nSupplierContactId** (bigint, PK) — unique contact record identifier.
- **nSupplierId** (int) — which supplier this contact belongs to.
- **strName** (varchar) — contact person's name.
- **strNumber** (varchar) — contact person's phone number.
- **strPosition** (varchar, nullable) — job title/position at the supplier.
- **strDepartment** (varchar, nullable) — department the contact belongs to.

### `tblsupplierbanks`
Bank account details for paying a supplier. Links to `tblsuppliers` via **nSupplierId**.
- **nSupplierBankId** (bigint, PK) — unique bank record identifier.
- **nSupplierId** (int) — which supplier this bank account belongs to.
- **strBankName** (varchar) — name of the bank.
- **strAccountName** (varchar) — name on the bank account.
- **strAccountNumber** (varchar) — the account number used for payment/transfer.

### `tblpayees`
Payee records for disbursements, optionally tied to a supplier. Links to `tblsuppliers` via **nSupplierId**.
- **nPayeeId** (int, PK) — unique payee identifier.
- **strPayeeName** (varchar, nullable) — the name to whom payment is issued (may differ from the supplier's registered name, e.g. an authorized representative).
- **nSupplierId** (int, nullable) — supplier this payee is associated with, if any.

---

## Transactions (Sales / Procurement) Domain

### `tbltransactions`
The header record for a procurement/sales transaction — a bid, request for quotation, or similar deal.
- **nTransactionId** (bigint, PK) — unique transaction identifier.
- **nCompanyId** (int, nullable) — which company this transaction is under.
- **nClientId** (int) — the client this transaction is for.
- **nAssignedAO** (int, nullable) — the assignee (Account Officer) responsible for this transaction.
- **dtAODueDate** (datetime, nullable) — deadline for the assigned AO to complete their part.
- **strTitle** (varchar) — descriptive title/name of the transaction (e.g. "Supply of Office Furniture").
- **strRefNumber** (varchar, nullable) — external/government reference number for the transaction.
- **dTotalABC** (double, nullable) — total Approved Budget for the Contract, the ceiling price for the whole deal.
- **cProcMode** (varchar, nullable) — procurement mode code (e.g. public bidding, negotiated, shopping).
- **cItemType** (char) — code indicating whether this transaction covers goods, services, etc.
- **strCode** (varchar, nullable) — internal short code/reference for the transaction.
- **cProcSource** (char, nullable) — code for the funding source of the procurement.
- **dtPreBid** (datetime, nullable) — scheduled date/time of the pre-bid conference.
- **strPreBid_Venue** (varchar, nullable) — location of the pre-bid conference.
- **dtDocIssuance** (datetime, nullable) — date bid documents start being issued.
- **strDocIssuance_Venue** (varchar, nullable) — location where documents are issued.
- **dtDocSubmission** (datetime, nullable) — deadline for submitting bid documents.
- **strDocSubmission_Venue** (varchar, nullable) — location where submissions are received.
- **dtDocOpening** (datetime, nullable) — date/time bids are opened.
- **strDocOpening_Venue** (varchar, nullable) — location where bids are opened.
- **dtDelivery** (datetime, nullable) — expected/target delivery date.
- **strDeliveryPlace** (varchar, nullable) — where the goods/services should be delivered.

### `tbltransactionitems`
The individual line items being requested/procured within a transaction. Links to `tbltransactions` via **nTransactionId**.
- **nTransactionItemId** (bigint, PK) — unique line item identifier.
- **nTransactionId** (int) — which transaction this item belongs to.
- **nItemNumber** (int) — line item order/number, for display sequencing.
- **nQuantity** (int) — quantity being requested.
- **strUOM** (varchar) — unit of measure (e.g. pcs, box, kg).
- **strName** (varchar) — name/description of the item.
- **strSpecs** (mediumtext, nullable) — detailed specifications, stored as rich text/HTML.
- **dUnitABC** (double, nullable) — the per-unit Approved Budget for the Contract (ceiling unit price).

### `tbltransactionhistories`
An audit trail of status changes for a transaction. Links to `tbltransactions` via **nTransactionId** and `tblusers` via **nUserId**.
- **nTransactionHistoryId** (bigint, PK) — unique history entry identifier.
- **nTransactionId** (int) — which transaction this history entry belongs to.
- **dtOccur** (datetime) — when this status change occurred.
- **nStatus** (int) — the status code the transaction moved to.
- **nUserId** (int, nullable) — which user triggered this status change.
- **strRemarks** (varchar, nullable) — free-text notes about this status change.

### `tblpricingsets`
Alternative sell-price proposals for a transaction — lets the business compare multiple pricing scenarios before choosing one. Links to `tbltransactions` via **nTransactionId**.
- **nPricingSetId** (bigint, PK) — unique pricing set identifier.
- **nTransactionId** (bigint) — which transaction this pricing set belongs to.
- **strName** (varchar) — label for the pricing set (e.g. "Option A").
- **bChosen** (tinyint, default 0) — flag marking this as the selected/active pricing set for the transaction.

### `tblitempricings`
The proposed selling price for a specific transaction item, under a specific pricing set. Links to `tblpricingsets` via **nPricingSetId** and `tbltransactionitems` via **nTransactionItemId**.
- **nItemPriceId** (bigint, PK) — unique price record identifier.
- **nPricingSetId** (int) — which pricing set this price belongs to.
- **nTransactionItemId** (int) — which transaction item this price is for.
- **dUnitSellingPrice** (double) — the proposed per-unit selling price to the client.
- **bPricingLocked** (tinyint, default 0) — flag preventing further edits once pricing is finalized.

### `tbldirectcostoptions`
A lookup list of direct-cost categories that can be applied to a transaction (e.g. freight, installation, labor).
- **nDirectCostOptionID** (int, PK) — unique category identifier.
- **strName** (varchar) — the category's display name.

### `tbldirectcosts`
Direct cost line items charged against a transaction. Links to `tbltransactions` via **nTransactionID** and `tbldirectcostoptions` via **nDirectCostOptionID**.
- **nDirectCostID** (int, PK) — unique cost entry identifier.
- **nTransactionID** (int) — which transaction this cost applies to.
- **nDirectCostOptionID** (int) — which cost category this entry falls under.
- **dAmount** (double) — the cost amount.

---

## Purchasing Domain

### `tblpurchaseitems`
A supplier's quote/canvass for fulfilling a specific transaction item — this is where sourcing and cost data live. Links to `tbltransactionitems` via **nTransactionItemId**, `tblsuppliers` via **nSupplierId**, and `tblsuppliercontacts` via **nSupplierContactId**.
- **nPurchaseItemId** (int, PK) — unique purchase item identifier.
- **nTransactionItemId** (int) — which transaction item this quote is sourcing.
- **nSupplierId** (int) — which supplier is quoting/supplying this item.
- **nSupplierContactId** (int, nullable) — the specific contact person at the supplier handling this quote.
- **nQuantity** (int) — quantity being purchased from this supplier.
- **strUOM** (varchar) — unit of measure for the purchase.
- **strBrand** (varchar, nullable) — brand of the item being sourced.
- **strModel** (varchar, nullable) — model number/name of the item.
- **strSpecs** (mediumtext, nullable) — supplier-specific specifications, as rich text/HTML.
- **dUnitPrice** (double) — the supplier's quoted unit price.
- **dEWT** (double, nullable) — Expanded Withholding Tax amount applicable to this purchase.
- **strProductCode** (varchar, nullable) — supplier's product/SKU code.
- **bAddOn** (tinyint, default 0) — flag marking this as an add-on item not part of the original request.
- **bIncluded** (tinyint) — flag marking whether this item is included in the current selection/comparison.
- **bPurchaseIncluded** (tinyint, nullable) — flag marking whether this item was included in the actual purchase order.
- **cPurchaseUnitPriceStatus** (char, nullable) — status code for the purchase price (e.g. pending, approved).
- **dPurchaseUnitPrice** (double, nullable) — the final approved purchase unit price (may differ from the initial quote).
- **dtCanvass** (datetime, nullable) — date this canvass/quote was obtained.

### `tblpurchaseitemhistories`
Status log for a purchase order item. Links to `tblpurchaseorder_items` via **nPurchaseOrder_ItemId** and `tblusers` via **nUserId**.
- **nPurchaseItemHistoryId** (int, PK) — unique history entry identifier.
- **nPurchaseOrder_ItemId** (int) — which PO line item this history entry belongs to.
- **dtOccur** (datetime) — when the status change occurred.
- **nStatus** (int) — the status code it moved to.
- **nUserId** (int) — which user triggered this change.

### `tblpurchaseorders`
The header record for a Purchase Order issued to a supplier.
- **nPurchaseOrderId** (int, PK) — unique PO identifier.
- **strPurchaseOrderNo** (varchar) — the human-readable PO number (printed on the document).
- **strShippingDetails** (varchar, nullable) — shipping/delivery instructions for the supplier.
- **cPaymentTerms** (varchar, nullable) — payment terms code (e.g. COD, 30 days).
- **nStatus** (int, nullable) — numeric status code for the PO's workflow stage.
- **cStatus** (char, nullable) — a secondary/simple status flag.
- **dtProceedToPayment** (datetime, nullable) — date the PO was cleared to proceed to payment.
- **dtPurchaseOrderCreated** (datetime, default current) — when the PO was created.

### `tblpurchaseorder_items`
Join table connecting purchase items to the PO they were placed under. Links to `tblpurchaseorders` via **nPurchaseOrderId** and `tblpurchaseitems` via **nPurchaseItemId**.
- **nPurchaseOrder_ItemId** (int, PK) — unique join-row identifier.
- **nPurchaseOrderId** (int, unique together with nPurchaseItemId) — which PO this item was placed under.
- **nPurchaseItemId** (int, indexed) — which purchase item (supplier quote) was placed on this PO.
- **dtAddedToCart** (datetime) — when this item was added to the PO/cart.

---

## Inventory Domain

### `tblinventories`
Stock received into inventory against a purchase item. Links to `tblpurchaseitems` via **nPurchaseItemId**.
- **nInventoryId** (int, PK) — unique inventory record identifier.
- **nPurchaseItemId** (int) — which purchased item this stock corresponds to.
- **nQuantity** (int) — quantity received into stock.
- **cStatus** (char, nullable) — inventory status code (e.g. received, released).
- **strReceiptNumber** (varchar, nullable) — delivery/receiving receipt number.
- **dtLog** (datetime) — when this inventory record was logged.

### `tblserialnumbers`
Individual serial numbers tied to a received inventory line (for serialized items like equipment). Links to `tblinventories` via **nInventoryId**.
- **nSNId** (int, PK) — unique serial number record identifier.
- **nInventoryId** (int) — which inventory receipt this serial number belongs to.
- **strSerialNumber** (varchar) — the actual serial number string.
- **dtLog** (datetime) — when this serial number was recorded.

---

## Accounting Domain (JEV = Journal Entry Voucher)

### `tbljournalaccounts`
The chart of accounts, structured as a self-referencing hierarchy via **nParentAccountId**.
- **nJournalAccountId** (int, PK) — unique account identifier.
- **nParentAccountId** (int, nullable) — the parent account this one rolls up under, for building account hierarchies (e.g. sub-account under a main account).
- **strAccountName** (varchar) — the account's display name (e.g. "Cash on Hand", "Accounts Payable").

### `tbljevs`
The header record for a Journal Entry Voucher — a bookkeeping entry recording a financial event.
- **nJEVId** (int, PK) — unique JEV identifier.
- **cJEVLinkType** (char) — code indicating what type of source document this JEV is linked to (e.g. voucher, sale).
- **dtOccur** (datetime) — the date the entry is booked for.
- **cStatus** (char) — status code (e.g. draft, posted).

### `tbljeventries`
The individual debit/credit lines that make up a JEV. Links to `tbljevs` via **nJEVId** and `tbljournalaccounts` via **nJournalAccountId**.
- **nJEVEntryId** (int, PK) — unique entry-line identifier.
- **nJEVId** (int) — which JEV this line belongs to.
- **nJournalAccountId** (int) — which account this line posts to.
- **dAmount** (double) — the debit or credit amount for this line (sign/side convention defined at the application level).

### `tblvouchers`
The header record for a Payment Voucher — a request/authorization to disburse funds. Links to `tbljevs` via **nJEVId** and `tblcompanies` via **nCompanyId**.
- **nVoucherId** (int, PK) — unique voucher identifier.
- **nJEVId** (int, nullable) — the journal entry this voucher is linked to once posted.
- **nCompanyId** (int, nullable) — which company is issuing this voucher.
- **cType** (char, nullable) — voucher type code (e.g. for supplier payment vs assignee payment).
- **cPaymentTerms** (char, nullable) — payment terms code.
- **nTypeId** (int, nullable) — additional type/category identifier for the voucher.
- **strNumber** (varchar, nullable) — the human-readable voucher number.
- **cStatus** (char, nullable) — workflow status code (e.g. draft, approved, paid).
- **dtCreated** (datetime, nullable) — when the voucher was created.

### `tblvoucher_assignees`
Voucher line items charged against an assignee — used when a voucher is paying/reimbursing an Account Officer rather than a supplier. Links to `tblvouchers` via **nVoucherId** and `tblassignees` via **nAssigneeId**.
- **nVoucherAssigneeId** (int, PK) — unique line item identifier.
- **nVoucherId** (int, nullable) — which voucher this line belongs to.
- **nAssigneeId** (int) — which assignee is being paid/charged.
- **strParticular** (varchar, nullable) — description of what this line is for.
- **nQuantity** (int) — quantity being charged.
- **strUOM** (varchar) — unit of measure.
- **dAmount** (double, nullable) — the amount for this line.

### `tblvoucher_suppliers`
Links a voucher to the purchase order it is paying — used when a voucher settles a supplier's PO. **This is the only table in the schema with a real, named database-level FOREIGN KEY constraint** (`tblvoucher_suppliers_ibfk_1`), enforcing that `nVoucherId` must reference an existing row in `tblvouchers`.
- **nVoucherSupplierId** (int, PK) — unique link record identifier.
- **nVoucherId** (int, nullable, indexed) — the voucher paying this PO; enforced FK → `tblvouchers.nVoucherId`.
- **nPurchaseOrderId** (int, nullable) — the purchase order being paid; relationship to `tblpurchaseorders` implied by naming only (not enforced).

---

## Misc

### `tblsqlerrors`
Application-level log for capturing raw SQL errors for debugging.
- **nErrorId** (bigint, PK) — unique error log entry identifier.
- **dtDate** (datetime, default current) — when the error was logged.
- **strError** (varchar) — the error message/details.

---

## Domain Flow (high level)

```
tblcompanies ─┐
tblclients   ─┼─> tbltransactions ─> tbltransactionitems ─┬─> tblpricingsets ─> tblitempricings
tblassignees ─┘         │                                  └─> tblpurchaseitems ─> tblpurchaseorder_items ─> tblpurchaseorders
                         │                                         │                        │
                         ├─> tbltransactionhistories                └─> tblpurchaseitemhistories
                         └─> tbldirectcosts ─> tbldirectcostoptions

tblpurchaseitems ─> tblinventories ─> tblserialnumbers

tblsuppliers ─┬─> tblsuppliercontacts
              ├─> tblsupplierbanks
              └─> tblpayees

tbljournalaccounts ─> tbljeventries ─> tbljevs ─> tblvouchers ─┬─> tblvoucher_assignees
                                                                 └─> tblvoucher_suppliers ─> tblpurchaseorders
```

---

*Generated from `lguph_hiramsdb_1_.sql`. Update this file whenever a migration adds/changes a table or column — it is not auto-synced with the database.*