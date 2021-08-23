import { IncomingRequestCf, ModuleWorkerContext } from '../deps_cf.ts';
import { TAILWEB_APP_DATA } from './tailweb_data.ts';

export default {

    async fetch(request: IncomingRequestCf, _env: WorkerEnv, _ctx: ModuleWorkerContext): Promise<Response> {
        const cfConnectingIp = request.headers.get('cf-connecting-ip');
        const url = new URL(request.url);

        if (url.pathname === '/') {
            return new Response(computeHtml(url), { headers: { 'Content-Type': 'text/html; charset=utf-8' }});
        } else if (url.pathname === '/app.js') {
            const response = await fetch(TAILWEB_APP_DATA);
            return new Response(await response.blob(), { headers: { 'Content-Type': 'text/javascript; charset=utf-8' }});
        } else if (url.pathname.startsWith('/fetch/')) {
            const fetchUrlStr = 'https://' + url.pathname.substring('/fetch/'.length);
            const fetchUrl = new URL(fetchUrlStr);
            if (fetchUrl.origin === 'https://api.cloudflare.com') {
                const { method } = request;
                const headers = [...request.headers].filter(v => !v[0].startsWith('cf-'));
                const body = undefined;
                console.log(method, fetchUrl, headers);
                return await fetch(fetchUrlStr, { method, headers, body });
            }
            throw new Response(`Unable to fetch ${fetchUrl}`, { status: 400 });
        }

        return new Response(`hello ${cfConnectingIp}`);
    },

};

// deno-lint-ignore no-empty-interface
export interface WorkerEnv {
    
}

//

function computeHtml(url: URL) {
        return `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Denoflare Tail</title>

<script type="module">
    document.documentElement.classList.remove('no-js');
    document.documentElement.classList.add('js');
</script>


<meta name="description" content="Page description">
<meta property="og:title" content="Unique page title - My Site">
<meta property="og:description" content="Page description">
<meta property="og:image" content="${url.origin}/image.jpg">
<meta property="og:image:alt" content="Image description">
<meta property="og:locale" content="en_US">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta property="og:url" content="${url.origin}/page">
<link rel="canonical" href="${url.origin}/page">

<link rel="icon" href="/favicon.ico">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/my.webmanifest">
<meta name="theme-color" content="#FF00FF">

<style>
body {
    font-family: -apple-system, BlinkMacSystemFont, avenir next, avenir, helvetica neue, helvetica, Ubuntu, roboto, noto, segoe ui, arial, sans-serif;

    background-color: #050510;
    background-image: linear-gradient(147deg, #050510 0%, #101020 74%);
    background-attachment: fixed;
    
    color: rgb(238, 238, 238); /* #eeeeee; */
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    margin: 0;
    padding: 0;

}

header {
    position: sticky;
}

form {
    display: grid;
}

label {
    grid-column: 1;
}

input, .formvalue {
    grid-column: 2;
}
</style>

</head>

<body>
<header>
  Profile:
  <select id="profile"></select>
  <button id="profile-edit">Edit</button>
  <button id="profile-new">New</button>

  Script:
  <select id="script"></select>
  <a id="add-script" href="#">Add script...</a>
</header>
<main>
<form id="profile-form" autocomplete="off">
  <h3>Profile</h3>
  <label for="profile-name">Profile name:</label>
  <input id="profile-name" type="text">

  <label for="account-id">Cloudflare Account ID:</label>
  <input id="profile-account-id" type="text">

  <label for="api-token">Cloudflare API Token:</label>
  <input id="profile-api-token" type="text">

  <div class="formvalue">
    <button id="profile-delete">Delete</button>
    <button id="profile-cancel">Cancel</button>
    <button id="profile-save">Save</button>
  </div>
</form>

</main>
<script src="/app.js" type="module"></script>
</body>
</html>`;
}
