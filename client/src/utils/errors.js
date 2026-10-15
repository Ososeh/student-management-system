// Convert different error shapes (especially Axios responses) into a message
// that can be shown to a user, with a safe fallback for unexpected failures.
export function getErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  // Axios puts server messages under response.data; ordinary JavaScript
  // errors use message. Optional chaining safely handles missing properties.
  return error.response?.data?.message || error.message || fallback;
}
