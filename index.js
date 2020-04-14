/**
 * Cloudflare Summer 2020 Internship Application
 * April 14, 2020
 * @author Andy Tran
 */

const variantsAPI = 'https://cfw-takehome.developers.workers.dev/api/variants'; // given API
const COOKIE_NAME = '_cflb'; // stores the index of the variant (load balancer)

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

/**
 * handleRequest takes the requests and directs it to appropriate variant
 * @param {any} request 
 */
async function handleRequest(request) {
    // Fetch Array of Variants from API
    const fetchResponse = await fetch(variantsAPI);
    const variantsJSON = await fetchResponse.json();
    const variants = variantsJSON.variants;

    // Get a random number for varient index
    let varNum = getRandVarNum(); 
    let url = variants[varNum];

    // If a cookie exists for the site, use that for variant index instead
    const cookie = getCookie(request, COOKIE_NAME);
    if (cookie) {
        url = variants[cookie];
    }
    let response = await fetch(url);

    // Edit Elements using HTMLRewriter
    let rewriter  = new HTMLRewriter()
        .on('title', new TitleHandler())
        .on('h1#title', new CardTitleHandler())
        .on('p#description', new BodyHandler())
        .on('a#url', new LinkHandler());

    let variantResponse = new Response(rewriter.transform(response).body, response);

    if (!cookie) {
        // Add Cookie using value of variant number
        let expires = new Date()
        expires.setDate(expires.getDate() + 1)
        const cookieStuff = `${COOKIE_NAME}=${varNum}; Expires=${expires.toGMTString()}; Secure; HttpOnly; path=/;`;
        variantResponse.headers.append('Set-Cookie', cookieStuff)
    }

    return variantResponse;
}

/**
 * returns a random variant index number; 0 or 1 (theoretically distributed 50/50)
 */
function getRandVarNum() {
    let randomIndex = Math.random() < 0.5;
    return randomIndex ? 1 : 0;
}

/**
 * Element handler to handle title of page
 */
class TitleHandler {
    element(e) {
        e.prepend("Page for ");
    }
}

/**
 * Element handler to handle title of card
 */
class CardTitleHandler {
    element(e) {
        e.prepend("This is ");
    }
}

/**
 * Element handler to handle description
 */
class BodyHandler {
    element(e) {
        e.setInnerContent('Hi, I\'m Andy, welcome to my Cloudflare 2020 Summer Internship Application! This variant will persist for 24 hours or until cookies are cleared.');
    }
}

/**
 * Element handler to handle link
 */
class LinkHandler {
    element(e) {
        e.setAttribute('href', 'https://andytrann.ca/');
        e.setInnerContent('Here\'s My Website!');
    }
}

/**
 * https://developers.cloudflare.com/workers/templates/pages/cookie_extract/
 * Grabs the cookie with name from the request headers
 * @param {Request} request incoming Request
 * @param {string} name of the cookie to grab
 */
function getCookie(request, name) {
    let result = null
    let cookieString = request.headers.get('Cookie')
    if (cookieString) {
        let cookies = cookieString.split(';')
        cookies.forEach(cookie => {
            let cookieName = cookie.split('=')[0].trim()
            if (cookieName === name) {
                let cookieVal = cookie.split('=')[1]
                result = cookieVal
            }
        })
    }
    return result
}