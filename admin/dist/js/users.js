const API_URL = "http://localhost:3000/api";
const userId = localStorage.getItem("userId");
if (!userId || userId === "undefined") {
  window.location.href = "index.html";
}
$(document).ready(function () {
  // Initialize the DataTable
  const table = $("#categoryTable").DataTable({
    responsive: true,
    lengthChange: false,
    autoWidth: false,
    buttons: ["copy", "csv", "excel", "pdf", "print"],
  });

  table
    .buttons()
    .container()
    .appendTo("#categoryTable_wrapper .col-md-6:eq(0)");

  // Load users data
  loadUsers();

  // Set up event listeners
  $("#addCategoryForm").on("submit", handleAddUser);
  $("#editCategoryForm").on("submit", handleEditUser);
});

// Load users from API
function loadUsers() {
  // Show loading indicator
  showLoading(true);

  // Fetch users from API
  fetch(`${API_URL}/users`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      displayUsers(data);
      showLoading(false);
    })
    .catch((error) => {
      console.error("Error fetching users:", error);
      showErrorMessage("Failed to load users. Please try again later.");
      showLoading(false);
    });
}

// Display users in the table
function displayUsers(users) {
  const table = $("#categoryTable").DataTable();
  table.clear();

  users.forEach((user, index) => {
    // Store the user ID as a data attribute instead of directly in the onclick
    table.row.add([
      index + 1,
      user.email,
      user.phone || "N/A",
      `<div class="btn-group">
        <button type="button" class="btn btn-info btn-sm mr-3 edit-user-btn" data-userid="${user.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button type="button" class="btn btn-danger btn-sm delete-user-btn" data-userid="${user.id}">
          <i class="fas fa-trash"></i>
        </button>
       </div>`,
    ]);
  });

  table.draw();

  // Add event listeners for the edit and delete buttons
  // These must be added after the table is redrawn
  $(".edit-user-btn").on("click", function () {
    const userId = $(this).data("userid");
    openEditUserModal(userId);
  });

  $(".delete-user-btn").on("click", function () {
    const userId = $(this).data("userid");
    deleteUser(userId);
  });
}

// Open modal to add new user
function openAddUserModal() {
  // Clear previous form data
  $("#addCategoryForm")[0].reset();

  // Update modal title and fields
  $(".modal-title").text("Add User");
  $("#addCategoryName").attr("placeholder", "Email");

  // Add phone field if it doesn't exist
  if ($("#addUserPhone").length === 0) {
    $("#addCategoryName").parent().after(`
      <div class="form-group">
        <label for="addUserPhone">Phone</label>
        <input type="text" class="form-control" id="addUserPhone" name="phone">
      </div>
    `);
  }

  // Show the modal
  $("#addCategoryModal").modal("show");
}

// Handle adding a new user
function handleAddUser(e) {
  e.preventDefault();

  const email = $("#addCategoryName").val();
  const phone = $("#addUserPhone").val();

  if (!email) {
    showErrorMessage("Email is required");
    return;
  }

  // Validate email format
  if (!validateEmail(email)) {
    showErrorMessage("Please enter a valid email address");
    return;
  }

  const userData = {
    email: email,
    phone: phone,
  };

  // Show loading
  showLoading(true);

  // Send POST request to API
  fetch(`${API_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      showLoading(false);
      showSuccessMessage("User added successfully");
      $("#addCategoryModal").modal("hide");
      loadUsers(); // Reload the users list
    })
    .catch((error) => {
      console.error("Error adding user:", error);
      showLoading(false);
      showErrorMessage("Failed to add user. Please try again.");
    });
}

// Open modal to edit a user
function openEditUserModal(userId) {
  // Show loading
  showLoading(true);

  // Fetch user details
  fetch(`${API_URL}/users/${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((user) => {
      // Update modal title and fields
      $(".modal-title").text("Edit User");
      $("#editCategoryId").val(user.id);
      $("#editCategoryName").val(user.email);
      $("#editCategoryName").attr("placeholder", "Email");

      // Add phone field if it doesn't exist
      if ($("#editUserPhone").length === 0) {
        $("#editCategoryName").parent().after(`
          <div class="form-group">
            <label for="editUserPhone">Phone</label>
            <input type="text" class="form-control" id="editUserPhone" name="phone" value="${
              user.phone || ""
            }">
          </div>
        `);
      } else {
        $("#editUserPhone").val(user.phone || "");
      }

      // Show the modal
      $("#editCategoryModal").modal("show");
      showLoading(false);
    })
    .catch((error) => {
      console.error("Error fetching user details:", error);
      showLoading(false);
      showErrorMessage("Failed to load user details. Please try again.");
    });
}

// Handle editing a user
function handleEditUser(e) {
  e.preventDefault();

  const userId = $("#editCategoryId").val();
  const email = $("#editCategoryName").val();
  const phone = $("#editUserPhone").val();

  if (!email) {
    showErrorMessage("Email is required");
    return;
  }

  // Validate email format
  if (!validateEmail(email)) {
    showErrorMessage("Please enter a valid email address");
    return;
  }

  const userData = {
    id: userId,
    email: email,
    phone: phone,
  };

  // Show loading
  showLoading(true);

  // Send PUT request to API
  fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      showLoading(false);
      showSuccessMessage("User updated successfully");
      $("#editCategoryModal").modal("hide");
      loadUsers(); // Reload the users list
    })
    .catch((error) => {
      console.error("Error updating user:", error);
      showLoading(false);
      showErrorMessage("Failed to update user. Please try again.");
    });
}

// Delete a user
function deleteUser(userId) {
  // Show confirmation dialog
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      // Show loading
      showLoading(true);

      // Send DELETE request to API
      fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          showLoading(false);
          showSuccessMessage("User deleted successfully");
          loadUsers(); // Reload the users list
        })
        .catch((error) => {
          console.error("Error deleting user:", error);
          showLoading(false);
          showErrorMessage("Failed to delete user. Please try again.");
        });
    }
  });
}

// Helper function to show loading indicator
function showLoading(isLoading) {
  if (isLoading) {
    // You can implement your own loading indicator here
    // For example, show a spinner overlay
  } else {
    // Hide loading indicator
  }
}

// Helper function to show success message using SweetAlert2
function showSuccessMessage(message) {
  Swal.fire({
    icon: "success",
    title: "Success",
    text: message,
    timer: 2000,
    showConfirmButton: false,
  });
}

// Helper function to show error message using SweetAlert2
function showErrorMessage(message) {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
  });
}

// Helper function to validate email format
function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

// Attach event handler for the "Add New" button
$(document).ready(function () {
  $('a[data-target="#addCategoryModal"]').on("click", function (e) {
    e.preventDefault();
    openAddUserModal();
  });
});
