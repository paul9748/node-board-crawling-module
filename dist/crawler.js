"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlCommunityPosts = void 0;
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
const iconv = require("iconv-lite");
const supportedEncodings = [
    "utf-8", "utf-16le", "iso-8859-1", "windows-1252",
    "euc-kr", "shift_jis", "gbk", "big5"
];
async function crawlCommunityPosts(options) {
    const { postListUrl, pageQueryParam, selectors, referenceTime, options: matchers } = options;
    const startTime = options.startTime ? options.startTime.toISOString() : new Date();
    const posts = [];
    try {
        let currentPage = selectors.startpage;
        let nextPageExists = true;
        const header = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
        };
        while (nextPageExists) {
            const pageUrl = postListUrl.includes("?")
                ? `${postListUrl}&${pageQueryParam}=${currentPage}`
                : `${postListUrl}?${pageQueryParam}=${currentPage}`;
            const response = await axios_1.default.get(pageUrl, { headers: header });
            console.log(`Page URL: ${pageUrl}`);
            const $ = cheerio_1.default.load(response.data, { decodeEntities: false });
            let stopCrawling = false;
            const page = $(selectors.postLink);
            if (page.length == 0) {
                throw new Error('No posts found: ' + selectors.postLink);
            }
            for (const element of page) {
                const postLink = $(element).attr('href');
                if (!postLink) {
                    console.warn('Post link not found, skipping post');
                    continue;
                }
                const postPageUrl = new URL(postLink, postListUrl).href;
                console.log(postPageUrl);
                try {
                    const postResponse = await axios_1.default.get(postPageUrl, {
                        headers: header, responseType: 'arraybuffer',
                    });
                    const headers = JSON.stringify(response.headers).toLowerCase();
                    let encoding = null;
                    for (const enc of supportedEncodings) {
                        if (headers.includes(enc.toLowerCase())) {
                            encoding = enc;
                            break;
                        }
                    }
                    if (!encoding) {
                        const decodedHeaderData = iconv.decode(Buffer.from(response.data), 'utf-8');
                        const $ = cheerio_1.default.load(decodedHeaderData);
                        const headContent = $('head').html();
                        if (headContent) {
                            for (const enc of supportedEncodings) {
                                if (headContent.includes(enc.toLowerCase())) {
                                    encoding = enc;
                                    break;
                                }
                            }
                        }
                    }
                    if (!encoding) {
                        encoding = 'utf-8';
                    }
                    let rowData = Buffer.from(postResponse.data);
                    let decodedData = iconv.decode(rowData, encoding);
                    await delay(1000 + Math.random() * 2000);
                    const postInfo = extractPostInfo(decodedData, selectors, matchers);
                    if (!postInfo.timestamp) {
                        console.warn('Timestamp not found, skipping post');
                        continue;
                    }
                    const postTime = parseDateString(postInfo.timestamp, matchers.timestamp);
                    if (postTime <= referenceTime || postInfo.timestamp === "" || postTime >= startTime) {
                        stopCrawling = true;
                        break;
                    }
                    posts.push({
                        ...postInfo,
                        link: postPageUrl,
                        timestamp: postTime.toString(),
                        data: [""],
                        data2: JSON
                    });
                }
                catch (error) {
                    console.error('Error occurred while crawling post:', error);
                }
            }
            if (stopCrawling)
                break;
            currentPage++;
        }
    }
    catch (error) {
        console.error('Error occurred while crawling:', error);
    }
    return posts;
}
exports.crawlCommunityPosts = crawlCommunityPosts;
function extractPostInfo(html, selectors, matchers) {
    const $ = cheerio_1.default.load(html, {
        decodeEntities: false
    });
    return {
        title: findTextContent($, selectors.title, matchers.title),
        author: findTextContent($, selectors.author, matchers.author),
        views: parseInt(findTextContent($, selectors.views, matchers.views)) || 0,
        upvotes: parseInt(findTextContent($, selectors.upvotes, matchers.upvotes)) || 0,
        content: findHtmlContent($, selectors.content, matchers.content),
        commentCount: parseInt(findTextContent($, selectors.commentCount, matchers.commentCount)) || 0,
        timestamp: findTextContent($, selectors.timestamp) || ""
    };
}
function findTextContent($, selector, matcher) {
    const element = $(selector);
    let content = element.text();
    if (!matcher || matcher.toString() === '/null/' || matcher.toString() === '/null/g') {
        return content;
    }
    const matchedContent = [...content.matchAll(matcher)].map(match => match[0]).join(" ");
    return matchedContent || content;
}
function findHtmlContent($, selector, matcher) {
    const element = $(selector);
    let content = element.html();
    if (!matcher || matcher.toString() === '/null/' || matcher.toString() === '/null/g') {
        return content;
    }
    const matchedContent = [...content.matchAll(matcher)].map(match => match[0]).join(" ");
    return matchedContent || content;
}
function parseDateString(dateString, matcher) {
    const match = dateString.match(matcher);
    if (match) {
        const [_, year, month, day, hour, minute, second] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
    }
    else {
        console.error('Invalid date string:', dateString);
        return new Date();
    }
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=crawler.js.map