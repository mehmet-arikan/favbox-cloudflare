// JWT token basit implementasyon
function generateToken(username) {
    const payload = {
        username: username,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 saat
    };
    return btoa(JSON.stringify(payload));
}

function verifyToken(token) {
    try {
        const payload = JSON.parse(atob(token));
        return payload.exp > Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
}

export async function onRequestPost(context) {
    try {
        const { username, password } = await context.request.json();
        
        // Environment variables'dan kullanıcı bilgilerini al
        const correctUsername = context.env.AUTH_USERNAME;
        const correctPassword = context.env.AUTH_PASSWORD;

        if (username === correctUsername && password === correctPassword) {
            const token = generateToken(username);
            
            return new Response(JSON.stringify({ 
                success: true, 
                token 
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } else {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Invalid credentials' 
            }), {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Server error' 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// CORS preflight
export async function onRequestOptions(context) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        }
    });
}
