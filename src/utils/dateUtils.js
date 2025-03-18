export const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    
    // Ensure we're using the local timezone
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(date);
};

// Add other date-related utilities
export const getTomorrowDate = () => {
    const now = new Date();
    return new Date(now.getTime() + (24 * 60 * 60 * 1000));
};

export const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    // Create a date object using the date string
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) return '';
    
    // Get the local timezone offset in minutes
    const tzOffset = date.getTimezoneOffset();
    
    // Adjust the date for the local timezone
    const localDate = new Date(date.getTime() - (tzOffset * 60000));
    
    // Format to YYYY-MM-DDThh:mm (required format for datetime-local input)
    return localDate.toISOString().slice(0, 16);
};
