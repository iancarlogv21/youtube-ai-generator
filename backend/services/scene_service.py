import re


def split_script_into_sentences(script: str) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", script.strip())

    return [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]


def extract_keyword(sentence: str) -> str:
    ignored_words = {
        "a",
        "an",
        "and",
        "are",
        "as",
        "at",
        "be",
        "by",
        "for",
        "from",
        "in",
        "is",
        "it",
        "of",
        "on",
        "or",
        "that",
        "the",
        "this",
        "to",
        "was",
        "with",
    }

    cleaned_sentence = re.sub(
        r"[^a-zA-Z0-9\s]",
        "",
        sentence.lower(),
    )

    useful_words = [
        word
        for word in cleaned_sentence.split()
        if word not in ignored_words and len(word) > 2
    ]

    if not useful_words:
        return "video scene"

    return " ".join(useful_words[:4])


def estimate_duration(sentence: str) -> int:
    words = sentence.split()

    average_words_per_second = 2.5
    estimated_seconds = round(len(words) / average_words_per_second)

    return max(3, estimated_seconds)


def create_visual_description(
    sentence: str,
    keyword: str,
) -> str:
    return (
        f"Create a cinematic visual showing {keyword}. "
        f"The visual should support this narration: {sentence}"
    )


def analyze_script(script: str) -> list[dict]:
    sentences = split_script_into_sentences(script)

    scenes = []

    for index, sentence in enumerate(sentences, start=1):
        keyword = extract_keyword(sentence)

        scenes.append(
            {
                "scene_number": index,
                "narration": sentence,
                "keyword": keyword,
                "visual_description": create_visual_description(
                    sentence,
                    keyword,
                ),
                "estimated_duration": estimate_duration(sentence),
            }
        )

    return scenes