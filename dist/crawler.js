"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlCommunityPosts = void 0;
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
async function crawlCommunityPosts(options) {
    const { postListUrl, pageQueryParam, selectors, referenceTime, options: matchers } = options;
    const posts = [];
    try {
        let currentPage = 1;
        let nextPageExists = true;
        while (nextPageExists) {
            const pageUrl = `${postListUrl}?${pageQueryParam}=${currentPage}`;
            const response = await axios_1.default.get(pageUrl);
            const $ = cheerio_1.default.load(response.data);
            let stopCrawling = false;
            $(selectors.postLink).each(async (index, element) => {
                const postLink = $(element).attr('href');
                if (!postLink) {
                    console.warn('Post link not found, skipping post');
                    return;
                }
                const postPageUrl = new URL(postLink, postListUrl).href;
                const postResponse = await axios_1.default.get(postPageUrl);
                const { title, author, views, upvotes, content, commentCount, timestamp } = extractPostInfo(postResponse.data, selectors);
                const postTime = parseDateString(timestamp, matchers.timestamp);
                if (postTime <= referenceTime || timestamp === "") {
                    stopCrawling = true;
                    return false;
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
            });
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
function extractPostInfo(html, selectors) {
    const $ = cheerio_1.default.load(html);
    return {
        title: findTextContent($, selectors.title),
        author: findTextContent($, selectors.author),
        views: findTextContent($, selectors.views),
        upvotes: findTextContent($, selectors.upvotes),
        content: findHtmlContent($, selectors.content),
        commentCount: findTextContent($, selectors.commentCount),
        timestamp: findTextContent($, selectors.timestamp)
    };
}
function findTextContent($, selector) {
    const element = $(selector);
    return element ? element.text().trim() : "";
}
function findHtmlContent($, selector) {
    const element = $(selector);
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
//# sourceMappingURL=crawler.js.map