exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { password } = JSON.parse(event.body);

        if (!password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Password is required' }),
            };
        }

        // Leer la variable de entorno, si no existe o está vacía, retornar falso por seguridad
        const validPasswordsStr = process.env.VALID_PASSWORDS || '';
        const validPasswords = validPasswordsStr.split(',').map(p => p.trim());

        const isValid = validPasswords.includes(password.trim());

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ valid: isValid })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
