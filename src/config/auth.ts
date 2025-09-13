export type Role = 'admin' | 'user';

export function isAdmin(email: string | null | undefined): boolean {
    return email ? email === process.env.NEXT_PUBLIC_ADMIN_EMAIL : false;
}