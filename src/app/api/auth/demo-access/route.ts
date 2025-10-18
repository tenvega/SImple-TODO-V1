import { NextRequest, NextResponse } from 'next/server';

const DEMO_ACCESS_CODE = process.env.DEMO_ACCESS_CODE || 'demo2024';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { accessCode } = body;

        if (!accessCode) {
            return NextResponse.json(
                { error: 'Access code is required' },
                { status: 400 }
            );
        }

        if (accessCode === DEMO_ACCESS_CODE) {
            return NextResponse.json(
                { 
                    message: 'Access granted',
                    accessGranted: true 
                },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                { 
                    error: 'Invalid access code',
                    accessGranted: false 
                },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Error verifying demo access:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
