import re
import ast  
from ollama import chat, ChatResponse
def get_keywords(topic):
    messages = [
        {
            "role": "system",
            "content": (
                "You are an AI assistant that generates multiple relevant keywords "
                "for YouTube videos given a topic. The user wants ONLY a Python list. The main topic of the topic should always be in the keyword so the keyword is specific only to this topic. "
                "Respond ONLY with the Python list. No explanations."
            )
        },
        {
            "role": "user",
            "content": (
                f"Topic: '{topic}'. "
                "Return multiple relevant keywords in a Python list. "
                "Return ONLY the Array and no extra text. just [] and use ' "
            )
        }
    ]

    response: ChatResponse = chat(
        model="deepseek-r1", 
        messages=messages,
        options={
            'temperature': 0,  
            'top_p': 1,        
            'top_k': 1      
        }
    )

    text_out = response.message.content
    print("[INFO] Model raw output:")
    print(text_out)

    if '</think>' in text_out:
        search_text = text_out.rsplit('</think>', 1)[-1]
    else:
        search_text = text_out

    match = re.search(
        r'\[\s*(?:"[^"]*"|\'[^\']*\')(?:\s*,\s*(?:"[^"]*"|\'[^\']*\'))*\s*\]', 
        search_text,
        re.DOTALL
    )

    if match:
        try:
            final_array = ast.literal_eval(match.group(0))
        except (SyntaxError, ValueError) as e:
            print(f"Error parsing array: {e}")
            final_array = []
    else:
        final_array = []

    return final_array
def main():
    topic="Hawk Tuah Coin rugpull"
    get_keywords(topic)
if __name__ == "__main__":
    main()