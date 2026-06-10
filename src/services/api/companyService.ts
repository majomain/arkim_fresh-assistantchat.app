import { isAuthBypassEnabled } from '@/config/devAuthBypass';
import { getMockCompanies } from '@/mocks/devMockData';
import { CompanyDetailList } from '@/types/company/company';

import { apiClientCore as apiClient } from './apiClient';

const companyService = {
    // get list of company for technician role
    getList: async (): Promise<CompanyDetailList> => {
        if (isAuthBypassEnabled()) return getMockCompanies();

        const response = await apiClient.get<CompanyDetailList>(
            '/company/list?permission=technician',
        );
        return response.data;
    },
};

export default companyService;
