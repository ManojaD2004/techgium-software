import React from "react";

import { CirclePlusIcon } from "lucide-react";
import Formcomp from "./components/formcomp";



const Page = () => {
  return (
    <div className="pl-2">
      <div className="flex items-center justify-center gap-1">
        <p className="text-2xl font-bold">Add user</p>
        <CirclePlusIcon />
      </div>
      <Formcomp/>
    </div>
  );
};

export default Page;
