'use client'

import { DraftContext } from "@/contexts/DraftContext";
import { useContext } from "react";

export const useDraft = () => useContext(DraftContext);