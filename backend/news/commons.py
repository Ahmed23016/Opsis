def filter_topic(topic):
    return topic.replace(" ", "+")

def write_to_html(content):
    with open("index.html","w",encoding="utf-8") as f:
        f.write(content)
def get_first_two_words(s):
    words = s.split()
    
    if len(words) >= 2:
        return ' '.join(words[:2])
    elif len(words) == 1:
        return words[0]
    else:
        return ''