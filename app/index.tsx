import { Redirect } from "expo-router";
import React from "react";

const index = () => {
  return <Redirect href="/(auth)/Welcome" />;
};

export default index;
