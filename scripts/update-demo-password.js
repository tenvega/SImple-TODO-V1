// Simple script to update demo user password using the API
const https = require('https');
const http = require('http');

async function updateDemoPassword() {
    try {
        console.log('🔄 Updating demo user password...');
        
        // The demo user ID (from the code)
        const demoUserId = '6896489d2dab362ba354ed00';
        
        // Make a request to the reset password API
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/users/${demoUserId}/reset-password`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (res.statusCode === 200) {
                        console.log('✅ Demo user password updated successfully!');
                        console.log('📧 Email: john@taskflow.com');
                        console.log('🔑 New Password:', response.newPassword);
                        console.log('');
                        console.log('⚠️  Please update the hardcoded password in LoginForm.tsx');
                        console.log('   Change "DemoSecure2024!" to:', response.newPassword);
                    } else {
                        console.error('❌ Error updating password:', response.error);
                    }
                } catch (error) {
                    console.error('❌ Error parsing response:', error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
            console.log('');
            console.log('💡 Make sure your development server is running on port 3000');
            console.log('   Run: npm run dev');
        });

        req.end();
        
    } catch (error) {
        console.error('❌ Error updating demo password:', error);
    }
}

updateDemoPassword();
