import fs from 'fs';
import { analyzeMorphemes } from './koalanlpAnalyzer.js';

// JSON 파일 경로
const jsonFilePath = 'SentiWord_info.json';

// JSON 파일 읽기
fs.readFile(jsonFilePath, 'utf8', async (err, data) => {
    if (err) {
        console.error('Error reading JSON file:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        const wordsToProcess = jsonData.map(item => item.word); // word들을 추출하여 배열로 만듦
        const processedData = await analyzeMorphemes(wordsToProcess);

        // 각 항목의 처리된 데이터와 기존 데이터를 합치기
        const combinedData = processedData.map((processedWord, index) => ({
            word: processedWord,
            word_root: jsonData[index].word_root,
            polarity: jsonData[index].polarity
        }));

        // 처리된 데이터를 JSON 파일로 저장
        const outputJsonFilePath = 'processed_data.json';
        fs.writeFile(outputJsonFilePath, JSON.stringify(combinedData, null, 4), 'utf8', (err) => {
            if (err) {
                console.error('Error writing JSON file:', err);
                return;
            }
            console.log('Processed data saved to', outputJsonFilePath);
        });

    } catch (err) {
        console.error('Error parsing JSON data:', err);
    }
});
