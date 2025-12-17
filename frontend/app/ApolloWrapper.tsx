"use client";

import { ReactNode } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { client } from "../graphql/client";

interface Props {
  children: ReactNode;
}

export default function ApolloWrapper({ children }: Props) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
