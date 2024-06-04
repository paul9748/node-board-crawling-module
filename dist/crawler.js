"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlCommunityPosts = void 0;
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
async function crawlCommunityPosts(options) {
    const { postListUrl, pageQueryParam, selectors, referenceTime, options: matchers } = options;
    const posts = [];
    try {
        let currentPage = selectors.startpage;
        let nextPageExists = true;
        const header = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
        };
        while (nextPageExists) {
            let pageUrl = ``;
            if (postListUrl.includes("?")) {
                pageUrl = `${postListUrl}&${pageQueryParam}=${currentPage}`;
            }
            else {
                pageUrl = `${postListUrl}?${pageQueryParam}=${currentPage}`;
            }
            const response = await axios_1.default.get(pageUrl, {
                headers: header
            });
            console.log(`Page URL: ${pageUrl}`);
            const $ = cheerio_1.default.load(response.data);
            let stopCrawling = false;
            let page = $(selectors.postLink);
            if (page.length == 0) {
                throw new Error('No posts found : ' + selectors.postLink);
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
                    const postResponse = await axios_1.default.get(postPageUrl, { headers: header });
                    await delay(1000 + Math.random() * 2000);
                    const { title, author, views, upvotes, content, commentCount, timestamp } = extractPostInfo(postResponse.data, selectors, matchers);
                    console.log(views, isNaN(views));
                    const postTime = parseDateString(timestamp, matchers.timestamp);
                    console.log(postTime, "//", referenceTime);
                    if (postTime <= referenceTime || timestamp === "") {
                        stopCrawling = true;
                        break;
                    }
                    posts.push({
                        title,
                        link: postPageUrl,
                        author,
                        views,
                        upvotes,
                        content,
                        commentCount,
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
    const $ = cheerio_1.default.load(html);
    return {
        title: findTextContent($, selectors.title, matchers.title),
        author: findTextContent($, selectors.author, matchers.author),
        views: parseInt(findTextContent($, selectors.views, matchers.views)),
        upvotes: parseInt(findTextContent($, selectors.upvotes, matchers.upvotes)),
        content: findHtmlContent($, selectors.content, matchers.content),
        commentCount: findTextContent($, selectors.commentCount, matchers.commentCount),
        timestamp: findTextContent($, selectors.timestamp),
    };
}
function findTextContent($, selector, matcher) {
    console.log(matcher);
    let element = $(selector);
    if (matcher !== undefined && matcher !== null && matcher !== RegExp("null") && matcher !== RegExp("")) {
        element = element.filter((_, element) => matcher.test($(element).text().trim()));
    }
    return element ? element.text().trim() : "";
}
function findHtmlContent($, selector, matcher) {
    let element = $(selector);
    if (matcher !== undefined && matcher !== null && matcher !== RegExp("null") && matcher !== RegExp("")) {
        element = element.filter((_, element) => matcher.test($(element).text().trim()));
    }
    return element ? element.html() : "";
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