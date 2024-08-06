import axios from 'axios';
import cheerio from 'cheerio';
import * as iconv from "iconv-lite";

import { CommunityPost, CrawlOptions, ProcessingOptions } from './types';

const supportedEncodings = [
    "utf-8", "utf-16le", "iso-8859-1", "windows-1252",
    "euc-kr", "shift_jis", "gbk", "big5"
];
export async function crawlCommunityPosts(options: CrawlOptions): Promise<CommunityPost[]> {
    const { postListUrl, pageQueryParam, selectors, referenceTime, options: matchers } = options;
    const startTime = options.startTime ? options.startTime.toISOString() : new Date();
    const posts: CommunityPost[] = [];

    try {
        let currentPage = selectors.startpage;
        let nextPageExists = true;
        const header = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
        }
        while (nextPageExists) {
            const pageUrl = postListUrl.includes("?")
                ? `${postListUrl}&${pageQueryParam}=${currentPage}`
                : `${postListUrl}?${pageQueryParam}=${currentPage}`;

            const response = await axios.get(pageUrl, { headers: header });
            console.log(`Page URL: ${pageUrl}`);
            const $ = cheerio.load(response.data, { decodeEntities: false });
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
                    const postResponse = await axios.get(postPageUrl, {
                        headers: header, responseType: 'arraybuffer',
                    });

                    const headers = JSON.stringify(response.headers).toLowerCase();
                    let encoding = null; // 기본 인코딩 형식
                    for (const enc of supportedEncodings) {
                        if (headers.includes(enc.toLowerCase())) {
                            // console.log(`found encoding : ${enc}`);
                            encoding = enc;
                            break;
                        }
                    }
                    // 헤더에서 인코딩 형식을 찾지 못하면 HTML 본문에서 <head> 영역만 검색
                    if (!encoding) {
                        const decodedHeaderData = iconv.decode(Buffer.from(response.data), 'utf-8');
                        const $ = cheerio.load(decodedHeaderData);
                        const headContent = $('head').html();
                        // console.log(`head content : ${headContent}`);

                        if (headContent) {
                            for (const enc of supportedEncodings) {
                                if (headContent.includes(enc.toLowerCase())) {
                                    // console.log(`found encoding : ${enc}`);
                                    encoding = enc;
                                    break;
                                }
                            }
                        }
                    }
                    //마지막까지 인코딩 형식을 찾지 못하면 기본적으로 UTF-8로 설정
                    if (!encoding) {
                        // console.log(`encoding : ${encoding}`);
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
    const $ = cheerio.load(html, {
        decodeEntities: false // HTML 엔터티 디코딩 설정
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

function findTextContent($: any, selector: string, matcher?: RegExp): string {
    const element = $(selector);
    let content = element.text();
    // console.log(`Selector: ${selector}, Content: ${content}`);

    if (!matcher || matcher.toString() === '/null/' || matcher.toString() === '/null/g') {
        return content;
    }

    const matchedContent = [...content.matchAll(matcher)].map(match => match[0]).join(" ");
    // console.log(`Matcher: ${matcher}, Matched Content: ${matchedContent}`);
    return matchedContent || content;
}

function findHtmlContent($: any, selector: string, matcher?: RegExp): string {
    const element = $(selector);
    let content = element.html();
    // console.log(`Selector: ${selector}, HTML Content: ${content}`);

    if (!matcher || matcher.toString() === '/null/' || matcher.toString() === '/null/g') {
        return content;
    }

    const matchedContent = [...content.matchAll(matcher)].map(match => match[0]).join(" ");
    // console.log(`Matcher: ${matcher}, Matched HTML Content: ${matchedContent}`);
    return matchedContent || content;
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

