import React, { useCallback } from "react";
import { Box, Typography, IconButton, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import InfoSection from "./InfoSection";
import FormGrid from "../../common/FormGrid";
import { SaveButton, BackButton } from "../../common/Buttons";
import { UOM_OPTIONS } from "../../../components/ui/account-officer/uomOptions";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableTransactionItem from "./SortableTransactionItem";
import api from "../../../utils/api/api";

function TransactionItemsRight({
  items,
  setItems,
  addingNewItem,
  setAddingNewItem,
  newItemForm,
  setNewItemForm,
  handleNewItemChange,
  saveNewItem,
  updateItem,
  editingItem,
  setEditingItem,
  expandedItemId,
  addingOptionItemId,
  togglePurchaseOptions,
  formData,
  errors,
  fields,
  handleChange,
  handleSwitchChange,
  handleEditOption,
  handleDeleteOption,
  handleToggleInclude,
  setAddingOptionItemId,
  savePurchaseOption,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);

      const updatedItems = reordered.map((item, index) => ({
        ...item,
        nItemNumber: index + 1,
      }));

      setItems(updatedItems);

      try {
        const payload = updatedItems.map(({ id, nItemNumber }) => ({
          id,
          nItemNumber,
        }));
        await api.put("transactions/items/update-order", { items: payload });
      } catch (err) {
        console.error("Failed to update order:", err);
      }
    },
    [items, setItems]
  );

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItemForm({
      name: item.name,
      specs: item.specs,
      qty: item.qty,
      uom: item.uom,
      abc: item.abc,
      purchasePrice: item.purchasePrice || "",
    });
    setAddingNewItem(true);
  };
  const handleDeleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await api.delete(`transaction-items/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  return (
    <InfoSection
      title={
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Transaction Items
          </Typography>
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setEditingItem(null);
              setNewItemForm({
                name: "",
                specs: "",
                qty: "",
                uom: "",
                abc: "",
                purchasePrice: "",
              });
              setAddingNewItem(true);
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      }
    >
      {addingNewItem && (
        <Paper
          sx={{ p: 2, borderRadius: 2, mb: 1, backgroundColor: "#fafafa" }}
        >
          <FormGrid
            fields={[
              { name: "name", label: "Item Name", xs: 12 },
              { name: "specs", label: "Specs", xs: 12 },
              { name: "qty", label: "Quantity", type: "number", xs: 4 },
              {
                name: "uom",
                label: "UOM",
                type: "select",
                xs: 4,
                options: UOM_OPTIONS, // ✅ same reusable list
              },
              { name: "abc", label: "Total ABC", type: "number", xs: 4 },
            ]}
            formData={newItemForm}
            handleChange={handleNewItemChange}
          />

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: 1, gap: 1 }}
          >
            <BackButton onClick={() => setAddingNewItem(false)} />
            {editingItem ? (
              <SaveButton onClick={() => updateItem(editingItem.id)} />
            ) : (
              <SaveButton onClick={saveNewItem} />
            )}
          </Box>
        </Paper>
      )}

      {items.length === 0 ? (
        <Box
          sx={{
            minHeight: 280,
            border: "1px dashed #e0e0e0",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">No items loaded</Typography>
        </Box>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <SortableTransactionItem
                key={item.id}
                item={item}
                onEdit={handleEditItem} // ✅ this triggers edit form
                onDelete={handleDeleteItem} // ✅ added
                expandedItemId={expandedItemId}
                addingOptionItemId={addingOptionItemId}
                togglePurchaseOptions={togglePurchaseOptions}
                formData={formData}
                errors={errors}
                fields={fields}
                handleChange={handleChange}
                handleSwitchChange={handleSwitchChange}
                handleEditOption={handleEditOption}
                handleDeleteOption={handleDeleteOption}
                handleToggleInclude={handleToggleInclude}
                setAddingOptionItemId={setAddingOptionItemId}
                savePurchaseOption={savePurchaseOption}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </InfoSection>
  );
}

export default TransactionItemsRight;
