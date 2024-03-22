import { crawlCommunityPosts } from './crawler';
import { processForRuliweb } from './siteProcessors'; // siteProcessors에서 필요한 함수를 import합니다.

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
    referenceTime: new Date('2024-03-22T04:39:00Z')
})
    .then(posts => {
        console.log(processForRuliweb(posts)); // processForRuliweb 함수 사용
    })
    .catch(error => {
        console.error('Error occurred during crawling:', error);
    });