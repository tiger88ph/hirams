import Swal from "sweetalert2";

export const confirmDelete = async (title = "Are you sure?", text = "You won't be able to revert this!") => {
  return await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });
};

export const deletingLoader = (loadingText = "Deleting... Please wait") => {
  return Swal.fire({
    title: "",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; gap:15px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#f5c518">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
        <span style="font-size:16px;">${loadingText}</span>
      </div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });
};

export const successAlert = (title = "Deleted!", text = "User has been deleted successfully.") => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    showConfirmButton: true,
  });
};

export const errorAlert = (title = "Error!", text = "Failed to delete user.") => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    showConfirmButton: true,
  });
};
