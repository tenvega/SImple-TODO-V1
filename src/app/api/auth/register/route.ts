import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { userFormSchema } from '@/lib/validations';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        
        // Validate input
        const validationResult = userFormSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validationResult.error.issues },
                { status: 400 }
            );
        }

        const { name, email, password } = validationResult.data;

        // Basic security checks
        if (name.length > 100 || email.length > 100) {
            return NextResponse.json(
                { error: 'Name or email too long' },
                { status: 400 }
            );
        }

        // Check for suspicious patterns (basic protection)
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /union\s+select/i,
            /drop\s+table/i,
            /delete\s+from/i
        ];

        const inputString = `${name}${email}`.toLowerCase();
        if (suspiciousPatterns.some(pattern => pattern.test(inputString))) {
            return NextResponse.json(
                { error: 'Invalid input detected' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Create new user
        const user = new User({
            name,
            email,
            password
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data (without password) and token
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        };

        return NextResponse.json(
            { 
                message: 'User created successfully',
                user: userResponse,
                token 
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
