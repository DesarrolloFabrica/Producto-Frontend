import { apiClient } from './apiClient';
import type { ApiSchoolCatalogItem } from './types/catalogsApi.types';

export const catalogsApi = {
  getSchools: () => apiClient.get<ApiSchoolCatalogItem[]>('/catalogs/schools'),
};
