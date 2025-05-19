const API_URL = 'http://localhost:3000/api'; 

// Initialize when document is ready
$(document).ready(function() {
  // Load current user data
  loadUserProfile();
  
  // Set up event listeners
  $('#profileUpdateForm').on('submit', handleProfileUpdate);
  $('#passwordChangeForm').on('submit', handlePasswordChange);
});

function loadUserProfile() {
  // Check if user is logged in
  const userId = localStorage.getItem('userId');
  if (!userId || userId === "undefined") {
    window.location.href = "index.html";
  }
  
  // Show loading
  showLoading(true);
  
  // Fetch user data from API
  fetch(`${API_URL}/users/${userId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(user => {
      // Populate form fields with user data
      $('#userEmail').val(user.email);
      $('#userPhone').val(user.phone || '');
      
      showLoading(false);
    })
    .catch(error => {
      console.error('Error fetching user profile:', error);
      showLoading(false);
      showErrorMessage('Failed to load user profile. Please try again later.');
      
      // Redirect to login if unauthorized
      if (error.message.includes('401')) {
        localStorage.removeItem('userId');
        window.location.href = 'index.html';
      }
    });
}

// Handle profile update
function handleProfileUpdate(e) {
  e.preventDefault();
  
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = 'index.html';
    return;
  }
  
  const email = $('#userEmail').val();
  const phone = $('#userPhone').val();
  
  if (!email) {
    showErrorMessage('Email is required');
    return;
  }
  
  // Validate email format
  if (!validateEmail(email)) {
    showErrorMessage('Please enter a valid email address');
    return;
  }
  
  const userData = {
    email: email,
    phone: phone
  };
  
  // Show loading
  showLoading(true);
  
  // Send PUT request to API
  fetch(`${API_URL}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      showLoading(false);
      showSuccessMessage('Profile updated successfully');
    })
    .catch(error => {
      console.error('Error updating profile:', error);
      showLoading(false);
      
      if (error.message.includes('409')) {
        showErrorMessage('Email is already in use by another account');
      } else {
        showErrorMessage('Failed to update profile. Please try again.');
      }
    });
}

// Handle password change
function handlePasswordChange(e) {
  e.preventDefault();
  
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = 'index.html';
    return;
  }
  
  const currentPassword = $('#currentPassword').val();
  const newPassword = $('#newPassword').val();
  const confirmPassword = $('#confirmPassword').val();
  
  // Validate passwords
  if (!currentPassword || !newPassword || !confirmPassword) {
    showErrorMessage('All password fields are required');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showErrorMessage('New passwords do not match');
    return;
  }
  
  if (newPassword.length < 6) {
    showErrorMessage('New password must be at least 6 characters long');
    return;
  }
  
  const passwordData = {
    currentPassword: currentPassword,
    password: newPassword
  };
  
  // Show loading
  showLoading(true);
  
  // First verify current password
  fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: $('#userEmail').val(),
      password: currentPassword
    })
  })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Current password is incorrect');
        }
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Current password is correct, now update to new password
      return fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: newPassword
        })
      });
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update password');
      }
      return response.json();
    })
    .then(data => {
      showLoading(false);
      showSuccessMessage('Password changed successfully');
      
      // Clear password fields
      $('#currentPassword').val('');
      $('#newPassword').val('');
      $('#confirmPassword').val('');
    })
    .catch(error => {
      console.error('Error changing password:', error);
      showLoading(false);
      showErrorMessage(error.message || 'Failed to change password. Please try again.');
    });
}

// Helper function to show loading indicator
function showLoading(isLoading) {
  if (isLoading) {
    // You can implement your own loading indicator here
    // For example, disable form buttons and show a spinner
    $('button[type="submit"]').prop('disabled', true);
  } else {
    // Hide loading indicator
    $('button[type="submit"]').prop('disabled', false);
  }
}

// Helper function to show success message using SweetAlert2
function showSuccessMessage(message) {
  Swal.fire({
    icon: 'success',
    title: 'Success',
    text: message,
    timer: 2000,
    showConfirmButton: false
  });
}

// Helper function to show error message using SweetAlert2
function showErrorMessage(message) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message
  });
}

// Helper function to validate email format
function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}