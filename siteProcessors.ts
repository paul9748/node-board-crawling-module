import { CommunityPost } from './types';

export function processForRuliweb(posts: CommunityPost[]): CommunityPost[] {
    return posts.map(post => {
        const regex = /조회\s+(\d+)/;
        const match = post.views.match(regex);

        if (match) {
            const views = parseInt(match[1]);
            if (!isNaN(views)) {
                return {
                    ...post,
                    views: views.toString()
                };
            }
        }

        return {
            ...post,
            views: "0"
        };
    });
}

// 새로운 사이트 처리 함수를 추가할 수 있습니다.
export function processForOtherSite(posts: CommunityPost[]): CommunityPost[] {
    // 다른 사이트의 포스트 데이터 처리 로직을 구현합니다.
    return posts;
}