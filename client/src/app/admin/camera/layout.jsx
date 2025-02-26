import { Toaster } from "@/components/ui/sonner";
import React from "react";


const Rootlayout = ({ children }) => {
  return (
    <div>
      <Toaster/>
      {children}
    </div>
  );
};

export default Rootlayout;
