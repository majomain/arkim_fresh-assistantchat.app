'use client';

import { AssetContext } from '@/contexts/AssetContext';
import { useContext } from 'react';

export const useAsset = () => useContext(AssetContext);
