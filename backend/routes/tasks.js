// If no time tracking exists, create one from creation to completion
if (!timeTracking) {
    const task = await Task.findById(taskId);
    if (task) {
        const startTime = new Date(task.createdAt);
        const endTime = new Date();
        
        // Check if task was completed on the same day it was created
        const isSameDay = startTime.toDateString() === endTime.toDateString();
        
        // If same day, use a more reasonable default duration (e.g., 2 hours)
        // This prevents skewing analytics with full-day durations
        const duration = isSameDay ? 
            7200 : // 2 hours in seconds for same-day completions
            Math.floor((endTime - startTime) / 1000); // Normal calculation for multi-day tasks

        await TimeTracking.create({
            userId: req.user.id,
            taskId,
            startTime,
            endTime,
            duration,
            completed: true
        });
    }
} 