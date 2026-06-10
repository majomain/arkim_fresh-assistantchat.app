'use client';

import { LocationContext } from '@/contexts/LocationContext';
import { useContext } from 'react';

export const useLocation = () => useContext(LocationContext);
