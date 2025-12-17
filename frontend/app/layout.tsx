// app/layout.tsx
"use client";
import './globals.css';
import { ReactNode } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "../lib/apollo";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <title>ChatApp</title>
      </head>
      <body>
        <ApolloProvider client={apolloClient}>
          {children}
        </ApolloProvider>
      </body>
    </html>
  );
}
