'use client'

import { ChatContext } from "@/contexts/ChatContext";
import { useContext } from "react";

export const useChat = () => useContext(ChatContext);