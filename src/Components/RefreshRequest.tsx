import Cookies from 'js-cookie';
export const getUrl = (endpoint: string) => `http://localhost:4000/${endpoint}`;

function isExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now() + 30000;
    } catch (error) {
        return true;
    }
}

export async function getValidatedToken(): Promise<string | null> {
    const token = Cookies.get('token');
    const refreshToken = Cookies.get('refreshToken');

    if (token && !isExpired(token)) {
        return token;
    }
    if (refreshToken) {
        try {
            const res = await fetch(getUrl('refresh-token'), {
                method: "POST",
                headers: { "Content-Type": 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
            if (res.ok) {
                const data = await res.json();
                Cookies.set('token', data.token, { expires: 1 / 24 });
                Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
                return data.token;
            }
        } catch (error) {
            console.log('something went wrong');
        }
    }
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    return null;
}