import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import { z } from 'zod';

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    tags: z.array(z.string()).optional(),
    completed: z.boolean().optional(),
    timeSpent: z.number().optional(),
    pomodoroCount: z.number().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;

        const task = await Task.findById(id);

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;

        const body = await request.json();
        const validatedData = updateTaskSchema.parse(body);

        const updateData: any = { ...validatedData };

        // Handle date conversion
        if (validatedData.dueDate) {
            updateData.dueDate = new Date(validatedData.dueDate);
        }

        // Handle completion date
        if (validatedData.completed !== undefined) {
            updateData.completedDate = validatedData.completed ? new Date() : null;
        }

        const task = await Task.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;

        const task = await Task.findByIdAndDelete(id);

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}