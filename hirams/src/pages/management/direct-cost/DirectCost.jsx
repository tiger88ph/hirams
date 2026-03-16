import React, { useState, useEffect } from "react";
import PageLayout from "../../../components/common/PageLayout";
import CustomTable from "../../../components/common/Table";
import CustomSearchField from "../../../components/common/SearchField";
import BaseButton from "../../../components/common/BaseButton";
import { Edit, Delete, Add } from "@mui/icons-material";
import api from "../../../utils/api/api";
import SyncMenu from "../../../components/common/Syncmenu";
import DirectCostAEModal from "./modal/DirectCostAEModal";
import DeleteVerificationModal from "../../common/modal/DeleteVerificationModal";
import echo from "../../../utils/echo"; // ← add this

function DirectCost() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [directCosts, setDirectCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState(null);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);
  const fetchDirectCosts = async () => {
    try {
      const response = await api.get("direct-cost-options");
      const directCostsArray = response.data || response || [];

      const formatted = directCostsArray.map((cost) => ({
        ...cost,
        id: cost.nDirectCostOptionID,
        costName: cost.strName,
      }));

      setDirectCosts(formatted);
    } catch (error) {
      console.error("Error fetching direct costs:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDirectCosts();
  }, []);
  // ── Real-time subscription ─────────────────────────────────
  useEffect(() => {
    const channel = echo.channel("direct-costs");

    channel.listen(".direct-cost.updated", (event) => {
      if (event.action === "deleted") {
        // Remove instantly from local state
        setDirectCosts((prev) =>
          prev.filter((c) => c.id !== event.directCostId),
        );
        return;
      }

      // created or updated — refetch
      fetchDirectCosts();
    });

    return () => {
      echo.leaveChannel("direct-costs");
    };
  }, []);

  const filteredDirectCosts = directCosts.filter((cost) => {
    const searchLower = search.toLowerCase();
    return cost.costName?.toLowerCase().includes(searchLower);
  });
  const handleAdd = () => {
    setSelectedCost(null);
    setModalMode("add");
    setIsModalOpen(true);
  };
  const handleEdit = (row) => {
    setSelectedCost(row);
    setModalMode("edit");
    setIsModalOpen(true);
  };
  const handleDelete = (id, costName) => {
    setEntityToDelete({
      type: "direct-cost",
      data: {
        id: id,
        name: costName,
      },
    });
    setOpenDeleteModal(true);
  };
  const handleDeleteSuccess = async () => {
    if (!entityToDelete?.data) return;
    setDirectCosts((prev) =>
      prev.filter((cost) => cost.id !== entityToDelete.data.id),
    );
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCost(null);
  };
  const handleSaveSuccess = () => {
    fetchDirectCosts();
    handleModalClose();
  };

  return (
    <PageLayout title="Direct Cost Options">
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Direct Cost"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={() => fetchDirectCosts()} />

        <BaseButton
          label="Add Cost Option"
          icon={<Add />}
          onClick={handleAdd}
          actionColor="approve"
          variant="contained"
        />
      </section>
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          columns={[
            { key: "costName", label: "Description" },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex justify-center space-x-2">
                  <BaseButton
                    icon={<Edit />}
                    tooltip="Edit Direct Cost"
                    size="small"
                    actionColor="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(row);
                    }}
                  />
                  <BaseButton
                    icon={<Delete />}
                    tooltip="Delete Direct Cost"
                    size="small"
                    actionColor="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(row.id, row.costName);
                    }}
                  />
                </div>
              ),
            },
          ]}
          rows={filteredDirectCosts}
          page={page}
          rowsPerPage={rowsPerPage} // ✅ Add this line
          loading={loading}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          onRowClick={(row) => {
            handleEdit(row);
          }}
        />
      </section>
      <DirectCostAEModal
        open={isModalOpen}
        onClose={handleModalClose}
        initialData={selectedCost}
        onSaved={handleSaveSuccess}
      />
      <DeleteVerificationModal
        open={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setEntityToDelete(null);
        }}
        entityToDelete={entityToDelete}
        onSuccess={handleDeleteSuccess}
      />
    </PageLayout>
  );
}

export default DirectCost;
