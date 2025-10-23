import React, { useState } from "react";
import ModalContainer from "../../../../common/ModalContainer";
import FormGrid from "../../../../common/FormGrid";

function AddTransactionModal({ open, handleClose }) {
  const [formData, setFormData] = useState({
    transactionName: "",
    clientName: "",
    company: "",
    amount: "",
    date: "",
    status: "",
  });

  // Dummy save handler
  const handleSave = () => {};

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Add Transaction"
      subTitle={formData.transactionName || ""}
      onSave={handleSave}
      saveLabel="Save"
      
      width={500}
    >
      <FormGrid
        fields={[
          { label: "Transaction Name", name: "transactionName", xs: 12 },
          { label: "Client Name", name: "clientName", xs: 6 },
          { label: "Company", name: "company", xs: 6 },
          { label: "Amount", name: "amount", xs: 6 },
          { label: "Date", name: "date", xs: 6, type: "date" },
          { label: "Status", name: "status", xs: 12 },
        ]}
        formData={formData}
        handleChange={(e) => {
          const { name, value } = e.target;
          setFormData((prev) => ({ ...prev, [name]: value }));
        }}
      />
    </ModalContainer>
  );
}

export default AddTransactionModal;
