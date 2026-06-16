import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(SCRIPT_DIR, '..', 'src')
DATA_DIR = os.path.join(SCRIPT_DIR, 'data')


def extract_js_strings(js_code):
    """Extract all string literals from JS source, preserving ${...} template expressions.

    Skips // single-line and /* */ multi-line comments so that apostrophes in
    comments (e.g. "don't") don't start spurious string extractions.
    """
    strings = []
    i = 0
    n = len(js_code)

    while i < n:
        # Skip single-line comments  //...
        if js_code[i] == '/' and i + 1 < n and js_code[i + 1] == '/':
            while i < n and js_code[i] != '\n':
                i += 1
            # Fall through to outer i += 1 which moves past the \n

        # Skip multi-line comments  /* ... */
        elif js_code[i] == '/' and i + 1 < n and js_code[i + 1] == '*':
            i += 2  # skip '/*'
            while i < n:
                if js_code[i] == '*' and i + 1 < n and js_code[i + 1] == '/':
                    i += 1  # position on '/' so outer i += 1 moves past it
                    break
                i += 1

        elif js_code[i] in ('"', "'", '`'):
            quote = js_code[i]
            i += 1
            escaped = False
            parts = []
            seg_start = i
            line_num = js_code[:i].count("\n")

            while i < n:
                c = js_code[i]

                if escaped:
                    escaped = False
                elif c == '\\':
                    escaped = True
                elif quote == '`' and c == '$' and i + 1 < n and js_code[i + 1] == '{':
                    # Capture the ${...} expression instead of dropping it
                    parts.append(js_code[seg_start:i])
                    i += 2  # skip '${')
                    depth = 1
                    expr_start = i
                    while i < n and depth > 0:
                        if js_code[i] == '{':
                            depth += 1
                        elif js_code[i] == '}':
                            depth -= 1
                        i += 1
                    expr = js_code[expr_start:i - 1]
                    parts.append('${' + expr + '}')
                    seg_start = i
                    continue
                elif c == quote:
                    break

                i += 1

            parts.append(js_code[seg_start:i])
            strings.append([''.join(parts),line_num+1])
        i += 1

    return strings


def looks_like_html(s):
    # Very basic heuristic: contains a tag
    return bool(re.search(r'<[^>]+>', s))


def extract_html_from_js(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        js_code = f.read()
    strings = extract_js_strings(js_code)
    return [s for s in strings if looks_like_html(s[0])]


if __name__ == '__main__':
    js_files = [
        e.name for e in os.scandir(SRC_DIR)
        if e.is_file() and e.name.endswith('.js')
    ]
    print(js_files)

    for filename in js_files:
        file_path = os.path.join(SRC_DIR, filename)
        html_blocks = extract_html_from_js(file_path)
        print(filename)
        if html_blocks:
            stem = filename.split('.')[0]
            out_path = os.path.join(DATA_DIR, stem + '.py')
            with open(out_path, 'w', errors='ignore') as dat:
                dat.write('dat=' + str(html_blocks))