import oidcAuthService from '@/services/auth/oidcAuthService';
import { useMutation } from '@tanstack/react-query';

export const useSignOutMutation = () => {
    return useMutation({
        mutationFn: () => oidcAuthService.signOut(),
        onSuccess: () => {
            // SignOut already handles the redirect to Cognito logout
            // No need to reload here as the redirect will happen
        },
    });
};
