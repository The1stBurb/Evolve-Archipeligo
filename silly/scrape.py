import os,re

files=[]
with os.scandir("C:\\Users\\ECoop\\OneDrive\\Desktop\\PYTHON_PROGRAMS\\Evolve\\src") as entries:
    for entry in entries:
        if entry.is_file():
            files.append(entry.name)
            # print(entry.name)
# files=files[:2]
print(files)
# for i in files:
#     print(i)
#     dat=""
#     with open("C:\\Users\\ECoop\\OneDrive\\Desktop\\PYTHON_PROGRAMS\\Evolve\\src\\"+i,"r")as fil:
#         dat=fil.read()
#     dat=re.findall(r"(<[^/ ].*?>.*?</.*?>)",dat,re.DOTALL)
#     nm=i.split(".")[0]
#     if len(dat)!=0:
#         with open("silly\\data\\"+nm+".py","w")as tfil:
#             tfil.write("dat="+str(dat))
import re

def extract_js_strings(js_code):
    strings = []
    i = 0
    n = len(js_code)

    while i < n:
        if js_code[i] in ('"', "'", '`'):
            quote = js_code[i]
            i += 1
            start = i
            escaped = False

            while i < n:
                c = js_code[i]

                if escaped:
                    escaped = False
                elif c == '\\':
                    escaped = True
                elif quote == '`' and c == '$' and i + 1 < n and js_code[i + 1] == '{':
                    # Skip ${...} blocks in template literals
                    i += 2
                    depth = 1
                    while i < n and depth > 0:
                        if js_code[i] == '{':
                            depth += 1
                        elif js_code[i] == '}':
                            depth -= 1
                        i += 1
                    continue
                elif c == quote:
                    break

                i += 1

            strings.append(js_code[start:i])
        i += 1

    return strings


def looks_like_html(s):
    # Very basic heuristic: contains a tag
    return bool(re.search(r'<[^>]+>', s))


def extract_html_from_js(file_path):
    with open(file_path, 'r', encoding='utf-8',errors="replace") as f:
        js_code = f.read()

    strings = extract_js_strings(js_code)
    html_strings = [s for s in strings if looks_like_html(s)]

    return html_strings

for i in files:
# if __name__ == "__main__":
    file_path = "src/"+i  # change to your file

    html_blocks = extract_html_from_js(file_path)

    # for i, block in enumerate(html_blocks, 1):
    #     print(f"\n--- HTML Block {i} ---\n")
    #     print(block)
    print(i)
    nm=i.split(".")[0]
    if len(html_blocks)!=0:
        with open("silly/data/"+nm+".py","w",errors="ignore")as dat:
            dat.write("dat="+str(html_blocks))