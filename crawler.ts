import axios from 'axios';
import cheerio from 'cheerio';
import { CommunityPost, CrawlOptions, ProcessingOptions } from './types';

export async function crawlCommunityPosts(options: CrawlOptions): Promise<CommunityPost[]> {
    const { postListUrl, pageQueryParam, selectors, referenceTime, options: matchers } = options;
    const posts: CommunityPost[] = [];

    try {
        let currentPage = selectors.startpage;
        let nextPageExists = true;
        const header = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
        }
        while (nextPageExists) {
            let pageUrl = ``;
            if (postListUrl.includes("?")) {
                pageUrl = `${postListUrl}&${pageQueryParam}=${currentPage}`
            } else {
                pageUrl = `${postListUrl}?${pageQueryParam}=${currentPage}`
            }
            const response = await axios.get(pageUrl, {
                headers: header
            }); console.log(`Page URL: ${pageUrl}`);
            // console.log(`Page HTML: ${response.data}`);
            const $ = cheerio.load(response.data);
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
                    const postResponse = await axios.get(postPageUrl, { headers: header });
                    await delay(1000 + Math.random() * 2000);
                    const { title, author, views, upvotes, content, commentCount, timestamp } = extractPostInfo(postResponse.data, selectors, matchers);
                    console.log(views, isNaN(views))
                    const postTime = parseDateString(timestamp, matchers.timestamp);
                    console.log(postTime, "//", referenceTime);
                    if (postTime <= referenceTime || timestamp === "") {
                        stopCrawling = true;
                        break; // Breaks out of the loop
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
                } catch (error) {
                    console.error('Error occurred while crawling post:', error);
                }
            }

            if (stopCrawling) break;

            currentPage++;
        }
    } catch (error) {
        console.error('Error occurred while crawling:', error);
    }

    return posts;
}

function extractPostInfo(html: string, selectors: any, matchers: ProcessingOptions): any {
    const $ = cheerio.load(html);

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

function findTextContent($: any, selector: string, matcher?: RegExp): string {
    let element = $(selector);
    if (matcher !== undefined && matcher !== null && matcher !== RegExp("/null/") && matcher !== RegExp("")) {
        console.log(matcher);
        element = element.filter((_, element) => matcher.test($(element).text().trim()));
    }
    return element ? element.text().trim() : "";
}

function findHtmlContent($: any, selector: string, matcher?: RegExp): string {
    let element = $(selector);
    if (matcher !== undefined && matcher !== null && matcher !== RegExp("/null/") && matcher !== RegExp("")) {
        console.log(matcher);
        element = element.filter((_, element) => matcher.test($(element).text().trim()));
    }
    return element ? element.html() : "";
}

function parseDateString(dateString: string, matcher: RegExp): Date {
    const match = dateString.match(matcher);

    if (match) {
        const [_, year, month, day, hour, minute, second] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
    } else {
        console.error('Invalid date string:', dateString);
        return new Date();
    }
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
