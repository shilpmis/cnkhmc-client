export const parseBackendError = (error: any, t: (key: string) => string) => {
  console.error("Backend error received:", error);
  
  if (!error) return t("an_unexpected_error_occurred");
  
  // Handle RTK Query error structure
  const errorData = error.data || error.response?.data;
  
  if (errorData) {
    // If there's a direct message
    if (errorData.message) {
      // Map common backend messages to translations if needed, 
      // or just return the message if it's already user-friendly
      return errorData.message;
    }
    
    // Handle VineJS validation errors
    if (errorData.errors && Array.isArray(errorData.errors)) {
      return errorData.errors.map((e: any) => e.message).join(", ");
    }
  }
  
  // Handle network errors
  if (error.status === 'FETCH_ERROR') {
    return t("network_error_please_check_your_connection");
  }
  
  if (error.status === 401) {
    return t("unauthorized_please_login_again");
  }
  
  if (error.status === 403) {
    return t("forbidden_you_dont_have_permission");
  }
  
  if (error.status === 404) {
    return t("resource_not_found");
  }
  
  if (error.status === 500) {
    return t("internal_server_error_please_try_again_later");
  }
  
  return t("failed_to_perform_action");
};
