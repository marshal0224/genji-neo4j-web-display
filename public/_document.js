import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta charset="utf-8" />
                <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#000000" />
                <meta
                    name="description"
                    content="Web site created using create-react-app"
                />
                <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
                <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
                <title>The Tale of Genji Poem Database</title>
            </Head>
            <body>
                <noscript>You need to enable JavaScript to run this app.</noscript>
                <Main />
                    {/* <div id="root" /> */}
                {/* </Main> */}
                <NextScript />
            </body>
        </Html>
    )
}