import { createContext, useContext } from "react";

export const SidebarContext = createContext({ collapsed: false,   collapsed: false,
  mobileSidebarOpen: false, });
export const useSidebar = () => useContext(SidebarContext);