import { UpdateSettingsInput } from '@/types/settings';
import { useMutation } from '@tanstack/react-query';

import { useAuthSession } from './use-auth-session';

export const useUpdateSettingsMutation = () => {
    const userId = useAuthSession().data?.user?.id;
    return useMutation<{}, Error, UpdateSettingsInput>({
        mutationFn: userId
            ? async (input) => {
                  // TODO: Call backend API to update settings
                  // Example: await fetch(`/api/user/${userId}/settings`, { method: 'PUT', body: JSON.stringify(input) })
                  console.log('Update settings:', input);
                  return {};
              }
            : undefined,
    });
};
