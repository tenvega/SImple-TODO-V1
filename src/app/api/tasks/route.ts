import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import { z } from 'zod';

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    tags: z.array(z.string()).default([]),
    userId: z.string().min(1, 'User ID is required'), // For now, we'll pass this in the body
});

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const completed = searchParams.get('completed');
        const priority = searchParams.get('priority');
        const tag = searchParams.get('tag');
        const search = searchParams.get('search');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        let query: any = { userId };

        // Add filters
        if (completed !== null) {
            query.completed = completed === 'true';
        }
        if (priority) {
            query.priority = priority;
        }
        if (tag) {
            query.tags = { $in: [tag] };
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const tasks = await Task.find(query).sort({ createdDate: -1 });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const validatedData = taskSchema.parse(body);

        const task = new Task({
            ...validatedData,
            dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        });

        await task.save();

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}