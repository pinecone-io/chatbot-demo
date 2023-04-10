import type { AppProps } from "next/app";
import { FpjsProvider } from "@fingerprintjs/fingerprintjs-pro-react";
import { configureAbly } from "@ably-labs/react-hooks";
import styles from "../styles/chat-ui-kit-styles/dist/default/styles.min.css";
// import protocolConfig from "protocol-config";

const prefix = process.env.API_ROOT || "";

const clientId =
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

configureAbly({
  authUrl: `${prefix}/api/createTokenRequest?clientId=${clientId}`,
  clientId: clientId,
});

const fpjsPublicApiKey = process.env.FINGERPRINT as string;

export default function App({ Component, pageProps }: AppProps) {
    // const clientName = 'uniswap';
    // const themePath = protocolConfig[clientName].theme;
    const themes = [
        'aave',
        'compound',
        'uniswap',
        'unstoppable',
    ];
  return (
    <main className={styles.main}>
        {/* <link rel="stylesheet" href={themePath} /> */}
        <FpjsProvider
            loadOptions={{
                apiKey: fpjsPublicApiKey,
            }}
            >
            <Component {...pageProps} />
        </FpjsProvider>
    </main>
    
  );
}
