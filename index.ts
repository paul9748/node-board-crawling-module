import axios from 'axios';
import cheerio from 'cheerio';

interface CommunityPost {
    title: string;
    link: string;
    author: string;
    views: string;
    upvotes: string;
    content: string;
    commentCount: string;
    timestamp: string;
}

interface CrawlOptions {
    postListUrl: string;
    pageQueryParam: string;
    selectors: {
        title: string;
        postLink: string;
        author: string;
        views: string;
        upvotes: string;
        content: string;
        commentCount: string;
        timestamp: string;
    };
    referenceTime: Date;
}

async function crawlCommunityPosts(options: CrawlOptions): Promise<CommunityPost[]> {
    try {
        const { postListUrl, pageQueryParam, selectors, referenceTime } = options;
        const posts: CommunityPost[] = [];
        let currentPage = 1;
        let nextPageExists = true;

        while (nextPageExists) {
            console.log(`Crawling page ${currentPage}`); // Log that we are crawling the current page
            const response = await axios.get(`${postListUrl}?${pageQueryParam}=${currentPage}`);
            const $ = cheerio.load(response.data);

            let stopCrawling = false;

            for (const element of $(selectors.postLink)) {
                console.log(`Crawling post ${element}`); // Log that we are crawling the current post
                const postLink = $(element).attr('href');
                const postPageUrl = new URL(postLink!, postListUrl).href;

                // Fetch post details
                const postResponse = await axios.get(postPageUrl);
                const postHtml = postResponse.data;
                const post$ = cheerio.load(postHtml);

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

                // Convert post timestamp to Date object
                const postTime = parseDateString(postTimestampString);
                console.log(`Post time: ${postTime}`);
                // Check if the post is older than the reference time
                if (postTime < referenceTime) {
                    console.log(postTime, referenceTime);
                    // If the post is older than the reference time, stop crawling
                    stopCrawling = true;
                    break; // Exit the loop
                }

                // Add post details to the posts array
                posts.push({
                    title: postTitle,
                    link: postPageUrl,
                    author: postAuthor,
                    views: postViews,
                    upvotes: postUpvotes,
                    content: postContent,
                    commentCount: postCommentCount,
                    timestamp: postTimestampString
                });
            }

            // Check if there is a next page and if crawling should continue
            if (!stopCrawling) {
                nextPageExists = $(/* Selector for next page link */).length > 0;
                console.log(`Next page exists: ${nextPageExists}`); // Log whether there is a next page
                currentPage++;
            } else {
                // Stop crawling if a post older than the reference time is found
                console.log('Stopping crawling because an older post was found');
                break;
            }
        }

        return posts;
    } catch (error) {
        console.error('Error occurred while crawling:', error);
        return [];
    }
}

function parseDateString(dateString: string): Date {
    const match = dateString.match(/(\d{4})\.(\d{2})\.(\d{2}) \((\d{2}):(\d{2}):(\d{2})\)/);

    if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const day = parseInt(match[3]);
        const hour = parseInt(match[4]);
        const minute = parseInt(match[5]);
        const second = parseInt(match[6]);

        return new Date(year, month, day, hour, minute, second);
    } else {
        console.error('Invalid date string:', dateString);
        return new Date();
    }
}

// Function to find nested elements in Cheerio object
function findNestedElement(post$: any, path: string): any {
    const selectors = path.split(',').map(selector => selector.trim());
    let element: any = null;

    for (const selector of selectors) {
        if (element === null) {
            element = post$(selector);
        } else {
            element = element.find(selector);
        }

        // If element not found at any level, return null
        if (element.length === 0) {
            console.log("null!");
            console.log(selectors);
            return null;
        }
    }
    return element;
}

export default crawlCommunityPosts;

// Below is the code calling the crawlCommunityPosts function
crawlCommunityPosts({
    postListUrl: 'https://bbs.ruliweb.com/best/humor_only/',
    pageQueryParam: 'page',
    selectors: {
        title: '.subject_inner_text',
        postLink: '.title_wrapper',
        author: '.user_view,.nick',
        views: '.user_view ,.user_info',
        upvotes: '.user_view,.like',
        content: '[itemprop="articleBody"]',
        commentCount: '.reply_count',
        timestamp: '.regdate',
    },
    referenceTime: new Date('2024-03-19T08:15:00Z')
}).then(posts => {
    console.log(posts);
});
