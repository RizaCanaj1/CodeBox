const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function getDayAsText(date) {
    const dayIndex = date.getDay(); 
    return dayNames[dayIndex]; 
}

function getMonthAsText(date) {
    const monthIndex = date.getMonth();
    return monthNames[monthIndex];
}
function formatTime(date, timezone = null) {
    let hours, minutes;
    if (timezone === null) {
        hours = date.getUTCHours().toString().padStart(2, '0');
        minutes = date.getUTCMinutes().toString().padStart(2, '0');
    } else {
        const timeZoneDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
        hours = timeZoneDate.getHours().toString().padStart(2, '0');
        minutes = timeZoneDate.getMinutes().toString().padStart(2, '0');
    }
    let timeString = `${hours}:${minutes}`;
    
    if (!timezone) {
        timeString += ' (UTC)';
    }
    return timeString;
}