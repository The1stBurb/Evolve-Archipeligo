"""
emit_vue.py; Walk a BIT tree and emit indented Vue 3 template markup.

Usage:
  python silly/emit_vue.py

  Output is written to silly/vue_output.html.
  Change the ActualData import at the bottom to switch datasets.
"""

import ast
import os
from analyzing import html_to_bit, BIT

INDENT = "  "
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'vue_output.html')
SEPARATOR = "\n\n<!-- ───────────────────────────────────────── -->\n\n"


def _unescape(s):
    """Convert a repr'd string child (e.g. \"'hello world'\") back to plain text."""
    try:
        return ast.literal_eval(s)
    except (ValueError, SyntaxError):
        return s


def format_attrs(specs):
    """Render a BIT's attribute dict as a Vue template attribute string.

    Handles:
      v-slot:trigger  → #trigger  (normalised back from html.parser-safe form)
      attr with None  → bare attribute (e.g. `controls`)
      attr with value → attr="value"
    """
    parts = []
    for name, value in specs.items():
        if name.startswith('v-slot:'):
            slot_name = name[len('v-slot:'):]
            parts.append(f'#{slot_name}')
        elif value is None:
            parts.append(name)
        else:
            parts.append(f'{name}="{value}"')
    return ' '.join(parts)


def bit_to_vue(node, depth=0):
    """Recursively render a BIT node or string child as Vue template markup."""
    indent = INDENT * depth

    if isinstance(node, str):
        text = _unescape(node).strip()
        return f"{indent}{text}" if text else ''

    tag = node.nm
    attrs_str = format_attrs(node.specs)
    open_part = f"<{tag}" + (f" {attrs_str}" if attrs_str else "")

    if not node.kids:
        return f"{indent}{open_part} />"

    child_lines = [
        line
        for kid in node.kids
        for line in [bit_to_vue(kid, depth + 1)]
        if line
    ]

    close_tag = f"</{tag}>"
    return f"{indent}{open_part}>\n" + "\n".join(child_lines) + f"\n{indent}{close_tag}"


def tree_to_vue(bit_list):
    """Render a list of root BIT nodes as a Vue template fragment string."""
    return "\n".join(bit_to_vue(node) for node in bit_list)


if __name__ == '__main__':
    # Change this import to whichever dataset you want to emit.
    # All available datasets are listed in analyzing.py's imports.
    from data.index import dat as ActualData

    fragments = []
    for html_str in ActualData:
        bit_list = html_to_bit(html_str[0])
        fragment = tree_to_vue(bit_list)
        if fragment.strip():
            fragments.append(f'<!-- Line Num: {html_str[1]} -->\n' + fragment)

    output = SEPARATOR.join(fragments)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(output)

    print(f"Wrote {len(fragments)} template fragment(s) to: {OUTPUT_FILE}")
