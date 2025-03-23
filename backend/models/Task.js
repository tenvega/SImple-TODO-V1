const taskSchema = new mongoose.Schema({
    // ... existing fields ...
    completedLate: {
        type: Boolean,
        default: false
    },
    completionDate: {
        type: Date
    }
});

// Add a pre-save middleware to check if task was completed late
taskSchema.pre('save', function(next) {
    if (this.isModified('completed') && this.completed) {
        this.completionDate = new Date();
        if (this.dueDate && this.completionDate > this.dueDate) {
            this.completedLate = true;
        }
    }
    next();
}); 