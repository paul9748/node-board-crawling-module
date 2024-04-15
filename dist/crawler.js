"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlCommunityPosts = void 0;
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
async function crawlCommunityPosts(options, matcher) {
    try {
        const { postListUrl, pageQueryParam, selectors, referenceTime } = options;
        const posts = [];
        let currentPage = 1;
        let nextPageExists = true;
        while (nextPageExists) {
            const pageUrl = `${postListUrl}?${pageQueryParam}=${currentPage}`;
            const response = await axios_1.default.get(pageUrl).catch((error) => {
                console.error(`Error occurred while fetching ${pageUrl}:`, error);
                nextPageExists = false;
                return null;
            });
            if (!response) {
                break;
            }
            const $ = await cheerio_1.default.load(response.data);
            let stopCrawling = false;
            for (const element of $(selectors.postLink)) {
                const postLink = $(element).attr('href');
                if (!postLink) {
                    console.warn('Post link not found, skipping post');
                    continue;
                }
                const postPageUrl = new URL(postLink, postListUrl).href;
                const postResponse = await axios_1.default.get(postPageUrl).catch((error) => {
                    console.error(`Error occurred while fetching ${postPageUrl}:`, error);
                    return null;
                });
                if (!postResponse) {
                    continue;
                }
                const postHtml = postResponse.data;
                const post$ = cheerio_1.default.load(postHtml);
                const postTitleElement = findNestedElement(post$, selectors.title);
                const postTitle = postTitleElement ? postTitleElement.text().trim() : "";
                const postAuthorElement = findNestedElement(post$, selectors.author);
                const postAuthor = postAuthorElement ? postAuthorElement.text().trim() : "";
                const postViewsElement = findNestedElement(post$, selectors.views);
                const postViews = postViewsElement ? postViewsElement.text().trim() : "";
                const postUpvotesElement = findNestedElement(post$, selectors.upvotes);
                const postUpvotes = postUpvotesElement ? postUpvotesElement.text().trim() : "";
                const postContentElement = findNestedElement(post$, selectors.content);
                const postContent = postContentElement ? postContentElement.html() : "";
                const postCommentCountElement = findNestedElement(post$, selectors.commentCount);
                const postCommentCount = postCommentCountElement ? postCommentCountElement.text().trim() : "";
                const postTimestampElement = findNestedElement(post$, selectors.timestamp);
                const postTimestampString = postTimestampElement ? postTimestampElement.text().trim() : "";
                const postTime = parseDateString(postTimestampString);
                console.log(postTime);
                if (postTime < referenceTime || postTimestampString == "") {
                    stopCrawling = true;
                    console.log(postTime, "to", parseDateString(posts[0].timestamp), referenceTime);
                    break;
                }
                posts.push({
                    title: postTitle,
                    link: postPageUrl,
                    author: postAuthor,
                    views: postViews,
                    upvotes: postUpvotes,
                    content: postContent,
                    commentCount: postCommentCount,
                    timestamp: postTimestampString,
                    data: [""],
                    data2: JSON
                });
            }
            if (stopCrawling) {
                break;
            }
            currentPage++;
        }
        return posts;
    }
    catch (error) {
        console.error('Error occurred while crawling:', error);
        return [];
    }
}
exports.crawlCommunityPosts = crawlCommunityPosts;
function parseDateString(dateString) {
    const match = dateString.match(/(\d{4})\.(\d{2})\.(\d{2}) \((\d{2}):(\d{2}):(\d{2})\)/);
    if (match) {
        const [_, year, month, day, hour, minute, second] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
    }
    else {
        console.error('Invalid date string:', dateString);
        return new Date();
    }
}
function findNestedElement(post$, path) {
    const selectors = path.split(',').map(selector => selector.trim());
    let element = null;
    for (const selector of selectors) {
        if (element === null) {
            element = post$(selector);
        }
        else {
            element = element.find(selector);
        }
        if (element.length === 0) {
            return null;
        }
    }
    return element;
}
//# sourceMappingURL=crawler.js.map