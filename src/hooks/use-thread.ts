'use client';

import { ThreadContext } from '@/contexts/ThreadContext';
import { useContext } from 'react';

export const useThread = () => useContext(ThreadContext);
