import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="" />
        <meta property="og:site_name" content="Harmony" />
        <meta property="og:title" content="Harmony" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
