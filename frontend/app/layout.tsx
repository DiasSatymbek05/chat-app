
import "./globals.css";
import ApolloWrapper from "./ApolloWrapper";

export const metadata = {
  title: "Chat App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
