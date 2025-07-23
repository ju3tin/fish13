import { WalletAdapterProvider } from "./providers";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletAdapterProvider>{children}</WalletAdapterProvider>
      </body>
    </html>
  );
}