from transformers import pipeline
import sys
import json
import io

sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')

# 텍스트 분류 파이프라인 초기화
pipe = pipeline("text-classification",
                model="nlp04/korean_sentiment_analysis_kcelectra")


def analyze_texts(texts):
    # 문자열 배열 분석
    results = pipe(texts)
    return results


def summarize_results(results):
    # 라벨별 개수 세기
    label_counts = {}
    for result in results:
        label = result['label']
        if label in label_counts:
            label_counts[label] += 1
        else:
            label_counts[label] = 1

    # 전체 문장 수
    total_texts = len(results)

    # 라벨별 비율 계산
    label_ratios = {label: count / total_texts for label,
                    count in label_counts.items()}

    return label_counts, label_ratios


if __name__ == '__main__':
    # 커맨드라인에서 입력 받음
    input_data = sys.stdin.read()
    if input_data.strip():  # 입력이 비어 있지 않은 경우에만 JSON 파싱 시도
        input_groups = json.loads(input_data)
        all_results = []
        for input_texts in input_groups:
            # 각 그룹별로 분석 실행
            analysis_results = analyze_texts(input_texts)
            # 결과 요약
            label_counts, label_ratios = summarize_results(analysis_results)
            # 그룹별 결과 추가
            all_results.append({
                "analysis_results": analysis_results,
                "label_counts": label_counts,
                "label_ratios": label_ratios
            })
        # JSON 형태로 결과 출력
        print(json.dumps(all_results, ensure_ascii=False))
