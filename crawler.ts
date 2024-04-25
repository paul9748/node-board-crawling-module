import axios from 'axios';
import cheerio from 'cheerio';
import { CommunityPost, CrawlOptions } from './types';

export async function crawlCommunityPosts(options: CrawlOptions): Promise<CommunityPost[]> {
    const { postListUrl, pageQueryParam, selectors, referenceTime, options: matchers } = options;
    const posts: CommunityPost[] = [];

    try {
        let currentPage = 1;
        let nextPageExists = true;

        while (nextPageExists) {
            const pageUrl = `${postListUrl}?${pageQueryParam}=${currentPage}`;
            const response = await axios.get(pageUrl);
            console.log(pageUrl);
            const $ = cheerio.load(response.data);
            let stopCrawling = false;

            for (const element of $(selectors.postLink)) {
                const postLink = $(element).attr('href');
                if (!postLink) {
                    console.warn('Post link not found, skipping post');
                    continue;
                }

                const postPageUrl = new URL(postLink, postListUrl).href;
                console.log(postPageUrl);

                try {
                    const postResponse = await axios.get(postPageUrl);
                    await delay(1000 + Math.random() * 2000);
                    const { title, author, views, upvotes, content, commentCount, timestamp } = extractPostInfo(postResponse.data, selectors);

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

function extractPostInfo(html: string, selectors: any): any {
    const $ = cheerio.load(html);

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

function findTextContent($: any, selector: string): string {
    const element = $(selector);
    return element ? element.text().trim() : "";
}

function findHtmlContent($: any, selector: string): string {
    const element = $(selector);
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
