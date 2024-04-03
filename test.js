import { KMR } from 'koalanlp/API.js';
import { initialize } from 'koalanlp/Util.js';
import { Tagger } from 'koalanlp/proc.js';

let initialized = false; // 초기화 추적을 위한 플래그

// KoalaNLP가 아직 초기화되지 않았다면 초기화하는 함수
const initializeKoalaNLP = async () => {
    if (!initialized) {
        await initialize({ packages: { KMR: '2.0.4' } });
        //verbose: true
        initialized = true;
    }
};
async function main() {
    await initializeKoalaNLP(); // KoalaNLP가 초기화되었는지 확인

    let tagger = new Tagger(KMR);
    console.log(await tagger("문장을 분석해봅니다. 이렇게요."));
}

main();