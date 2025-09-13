import 'next-auth';
import { Role } from '@/config/auth';

declare module 'next-auth' {
    interface Session {
        user: {
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role: Role;
        }
    }
}