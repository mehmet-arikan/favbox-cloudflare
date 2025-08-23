export async function onRequestPost(context) {
    try {
        const { username, password } = await context.request.json();
        
        // Environment Variables'dan güvenli şekilde al
        const correctUsername = context.env.AUTH_USERNAME;
        const correctPassword = context.env.AUTH_PASSWORD;
        
        // Güvenlik kontrolü
        if (!correctUsername || !correctPassword) {
            console.error('Environment variables not set');
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Server configuration error' 
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        if (username === correctUsername && password === correctPassword) {
            // JWT token oluştur (daha güvenli)
            const payload = {
                username: username,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 saat
            };
            
            const token = btoa(JSON.stringify(payload));
            
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
        console.error('Auth error:', error);
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

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
