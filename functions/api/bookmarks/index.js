// Token doğrulama
function verifyToken(token) {
    try {
        const payload = JSON.parse(atob(token));
        return payload.exp > Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
}

function validateAuth(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    const token = authHeader.substring(7);
    return verifyToken(token);
}

// GET - Tüm bookmarkları getir
export async function onRequestGet(context) {
    if (!validateAuth(context.request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    try {
        const { results } = await context.env.DB.prepare(
            'SELECT * FROM bookmarks ORDER BY created_at DESC'
        ).all();

        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: 'Database error',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}

// POST - Yeni bookmark ekle
export async function onRequestPost(context) {
    if (!validateAuth(context.request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    try {
        const { url, title, description, tags } = await context.request.json();

        if (!url) {
            return new Response(JSON.stringify({ error: 'URL is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Otomatik başlık alma
        let autoTitle = title || url;
        if (!title) {
            try {
                // Basit title extraction (CORS sınırlamaları nedeniyle sınırlı)
                autoTitle = new URL(url).hostname;
            } catch {
                autoTitle = url;
            }
        }

        const result = await context.env.DB.prepare(`
            INSERT INTO bookmarks (url, title, description, tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(url, autoTitle, description, tags).run();

        if (result.success) {
            const { results } = await context.env.DB.prepare(
                'SELECT * FROM bookmarks WHERE id = ?'
            ).bind(result.meta.last_row_id).all();

            return new Response(JSON.stringify(results[0]), {
                status: 201,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        } else {
            throw new Error('Insert failed');
        }
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: 'Failed to add bookmark',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}

// CORS
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
